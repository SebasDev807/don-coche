'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendAppointmentCreatedNotification } from '@/lib/whatsapp/whatsapp.service';

export interface PendingAppointmentInfo {
  id: string;
  scheduledAt: Date;
  description: string | null;
  vehicle: {
    plate: string;
    brand: string | null;
    model: string | null;
  };
}

export async function getPendingAppointmentsByCc(cc: string): Promise<PendingAppointmentInfo[]> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { cc },
      include: {
        appointments: {
          where: { status: 'PENDIENTE' },
          include: {
            vehicle: true,
          },
          orderBy: { scheduledAt: 'asc' },
        }
      }
    });

    if (!customer || customer.appointments.length === 0) {
      return [];
    }

    return customer.appointments.map(apt => ({
      id: apt.id,
      scheduledAt: apt.scheduledAt,
      description: apt.description,
      vehicle: {
        plate: apt.vehicle.plate,
        brand: apt.vehicle.brand,
        model: apt.vehicle.model,
      }
    }));
  } catch (error) {
    console.error('[getPendingAppointmentsByCc] Error:', error);
    return [];
  }
}

export async function rescheduleAppointmentAction(appointmentId: string, newScheduledAt: Date): Promise<{ success: boolean; message: string }> {
  try {
    // Buscar la cita original
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
      }
    });

    if (!existingAppointment || existingAppointment.status !== 'PENDIENTE') {
      return { success: false, message: 'La cita no existe o ya no está pendiente.' };
    }

    // Actualizar la cita
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        scheduledAt: newScheduledAt,
        updatedAt: new Date(),
      }
    });

    // Enviar notificación a la campana
    const customerName = existingAppointment.customer.name || 'Un cliente';
    const day = newScheduledAt.getDate();
    const month = newScheduledAt.toLocaleString('es-CO', { month: 'long', timeZone: 'America/Bogota' });
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    const year = newScheduledAt.getFullYear();
    const time = newScheduledAt.toLocaleString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' });
    const formattedDate = `${day} de ${capitalizedMonth} de ${year} a las ${time}`;

    await prisma.appNotification.create({
      data: {
        type: 'appointment_rescheduled',
        title: 'Cita Reagendada (Web)',
        message: `${customerName} ha reagendado su cita para el ${formattedDate}.`,
        link: '/citas'
      }
    });

    // Enviar WhatsApp al cliente
    if (existingAppointment.customer.phone && existingAppointment.customer.name) {
      try {
        const firstName = existingAppointment.customer.name.split(' ')[0];
        
        sendAppointmentCreatedNotification(
          existingAppointment.customer.phone,
          firstName,
          formattedDate
        ).catch(err => console.error('[WhatsApp] Error enviando notificación de cita (pública):', err));
      } catch (waError) {
        console.error('[WhatsApp] Error al intentar enviar WhatsApp de cita creada (pública):', waError);
      }
    }

    revalidatePath('/citas');
    return { success: true, message: '¡Cita reagendada con éxito!' };
  } catch (error: any) {
    console.error('[rescheduleAppointmentAction] Error:', error);
    return { success: false, message: 'Error al intentar reagendar la cita.' };
  }
}
