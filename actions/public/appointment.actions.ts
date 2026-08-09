'use server';

import { prisma } from '@/lib/prisma';
import { publicAppointmentSchema, type PublicAppointmentSchemaType } from '@/validation/public';
import { revalidatePath } from 'next/cache';
import { sendAppointmentCreatedNotification } from '@/lib/whatsapp/whatsapp.service';

export async function bookAppointment(data: PublicAppointmentSchemaType) {
  try {
    const parsed = publicAppointmentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: 'Datos inválidos', errors: parsed.error.format() };
    }

    const {
      customerCc,
      customerName,
      customerPhone,
      customerEmail,
      plate,
      carBrand,
      carModel,
      carColor,
      scheduledAtDate,
      scheduledAtTime,
      description
    } = parsed.data;

    // Combine date and time into a single ISO string
    // scheduledAtDate is YYYY-MM-DD, scheduledAtTime is HH:mm
    const dateTimeString = `${scheduledAtDate}T${scheduledAtTime}:00.000Z`;
    const scheduledAt = new Date(dateTimeString);
    // Add timezone offset so it matches local time. (Assume UTC-5 for Colombia)
    scheduledAt.setHours(scheduledAt.getHours() + 5);

    let isReschedule = false;

    await prisma.$transaction(async (tx) => {
      // 1. Manage Customer
      let customer = await tx.customer.findUnique({
        where: { cc: customerCc },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            cc: customerCc,
            name: customerName,
            phone: customerPhone,
            email: customerEmail || null,
          },
        });
      } else {
        // Update info if it was missing
        const updates: any = {};
        if (!customer.name && customerName) updates.name = customerName;
        if (!customer.phone && customerPhone) updates.phone = customerPhone;
        if (!customer.email && customerEmail) updates.email = customerEmail;

        if (Object.keys(updates).length > 0) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: updates,
          });
        }
      }

      // 2. Manage Vehicle
      let vehicle = await tx.vehicle.findUnique({
        where: { plate },
      });

      if (!vehicle) {
        vehicle = await tx.vehicle.create({
          data: {
            plate,
            brand: carBrand,
            model: carModel,
            color: carColor || null,
            customerId: customer.id,
          },
        });
      } else {
        // Verify ownership
        if (vehicle.customerId !== customer.id) {
          throw new Error('El vehículo ya está registrado a nombre de otro cliente.');
        }
      }

      // 3. Create or Update Appointment
      const existingAppointment = await tx.appointment.findFirst({
        where: { customerId: customer.id, status: 'PENDIENTE' }
      });

      if (existingAppointment) {
        await tx.appointment.update({
          where: { id: existingAppointment.id },
          data: {
            vehicleId: vehicle.id,
            scheduledAt,
            description,
          }
        });
        isReschedule = true;
      } else {
        await tx.appointment.create({
          data: {
            customerId: customer.id,
            vehicleId: vehicle.id,
            scheduledAt,
            description,
          }
        });
      }
    });

    // 4. Enviar notificación por WhatsApp y Campana
    if (customerPhone && customerName) {
      try {
        const day = scheduledAt.getDate();
        const month = scheduledAt.toLocaleString('es-CO', { month: 'long', timeZone: 'America/Bogota' });
        const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
        const year = scheduledAt.getFullYear();
        const time = scheduledAt.toLocaleString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' });
        const formattedDate = `${day} de ${capitalizedMonth} de ${year} a las ${time}`;
        
        if (isReschedule) {
          await prisma.appNotification.create({
            data: {
              type: 'appointment_rescheduled',
              title: 'Cita Reagendada (Web)',
              message: `${customerName} ha reagendado su cita para el ${formattedDate}.`,
              link: '/citas'
            }
          });
        }

        // Usamos el primer nombre
        const firstName = customerName.split(' ')[0];
        
        sendAppointmentCreatedNotification(
          customerPhone,
          firstName,
          formattedDate
        ).catch(err => console.error('[WhatsApp] Error enviando notificación de cita (pública):', err));
      } catch (waError) {
        console.error('[WhatsApp] Error al intentar enviar WhatsApp/Campana de cita creada (pública):', waError);
      }
    }

    revalidatePath('/citas');
    return { success: true, message: isReschedule ? '¡Cita reagendada con éxito!' : '¡Cita reservada con éxito!' };
  } catch (error: any) {
    console.error('[bookAppointment] Error:', error);
    return { success: false, message: error.message || 'Error al agendar la cita' };
  }
}
