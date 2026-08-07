'use server';

import { prisma } from '@/lib/prisma';
import { publicAppointmentSchema, type PublicAppointmentSchemaType } from '@/validation/public';
import { revalidatePath } from 'next/cache';

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

    revalidatePath('/citas');
    return { success: true, message: '¡Cita reservada con éxito!' };
  } catch (error: any) {
    console.error('[bookAppointment] Error:', error);
    return { success: false, message: error.message || 'Error al agendar la cita' };
  }
}
