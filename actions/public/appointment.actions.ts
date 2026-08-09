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
            email: customerEmail,
          },
        });
      } else {
        // Update customer details if they provided new ones
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            name: customerName || customer.name,
            phone: customerPhone || customer.phone,
            email: customerEmail || customer.email,
          },
        });
      }

      // 2. Find or create vehicle
      const plateUpper = plate.toUpperCase();
      let vehicle = await tx.vehicle.findUnique({
        where: { plate: plateUpper },
      });

      if (!vehicle) {
        vehicle = await tx.vehicle.create({
          data: {
            plate: plateUpper,
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

      // 3. Create Appointment
      await tx.appointment.create({
        data: {
          customerId: customer.id,
          vehicleId: vehicle.id,
          scheduledAt,
          description,
        }
      });
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
        
        await prisma.appNotification.create({
          data: {
            type: 'appointment_created',
            title: 'Nueva Cita (Web)',
            message: `${customerName} ha programado una nueva cita para el ${formattedDate}.`,
            link: '/citas'
          }
        });

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
    return { success: true, message: '¡Cita reservada con éxito!' };
  } catch (error: any) {
    console.error('[bookAppointment] Error:', error);
    return { success: false, message: error.message || 'Error al agendar la cita' };
  }
}

/**
 * Obtiene los slots reservados para un día específico (público).
 * @param dateStr - Fecha en formato ISO (YYYY-MM-DD).
 * @returns Array de horas ocupadas (ej: [8, 10, 14]).
 */
export async function getPublicBookedSlots(dateStr: string): Promise<number[]> {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'PENDIENTE',
        scheduledAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      select: { scheduledAt: true },
    });

    return appointments.map((apt) => new Date(apt.scheduledAt).getHours());
  } catch (error: any) {
    console.error('Error fetching public booked slots:', error);
    return [];
  }
}
