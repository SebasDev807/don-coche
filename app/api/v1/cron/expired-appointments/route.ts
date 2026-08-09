import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendExpiredAppointmentNotification } from '@/lib/whatsapp';
import { AppointmentStatus } from '@prisma/client';

// Forzar que este endpoint sea siempre dinámico y no se quede en caché
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    
    // Calculamos el tiempo límite: hace 30 minutos
    const limitTime = new Date(now.getTime() - 30 * 60 * 1000);

    // Buscar citas en estado PENDIENTE cuya fecha programada sea menor (más antigua) que limitTime
    const expiredAppointments = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.PENDIENTE,
        scheduledAt: {
          lt: limitTime,
        },
      },
      include: {
        customer: true,
      },
    });

    if (expiredAppointments.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: 'No hay citas vencidas para actualizar.',
      });
    }

    let sentCount = 0;

    for (const appointment of expiredAppointments) {
      // Formatear fecha y hora para el template de WhatsApp
      const scheduledDate = new Date(appointment.scheduledAt);
      
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const dateStr = `${scheduledDate.getDate()} de ${meses[scheduledDate.getMonth()]}`;
      
      const hours = scheduledDate.getHours();
      const minutes = scheduledDate.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const timeStr = `${formattedHours}:${formattedMinutes} ${ampm}`;
      
      const customerName = appointment.customer.name 
        ? appointment.customer.name.split(' ')[0] 
        : 'Cliente';

      // 1. Actualizar estado a PERDIDA
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: AppointmentStatus.PERDIDA },
      });

      // 2. Enviar WhatsApp si tiene teléfono
      if (appointment.customer.phone) {
        await sendExpiredAppointmentNotification(
          appointment.customer.phone,
          customerName,
          dateStr,
          timeStr,
          appointment.id
        );
        sentCount++;
        console.log(`[Cron Expired] Cita ${appointment.id} de ${customerName} marcada como PERDIDA. WhatsApp enviado.`);
      } else {
        console.log(`[Cron Expired] Cita ${appointment.id} marcada como PERDIDA. Sin teléfono para WhatsApp.`);
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      message: `Proceso finalizado. ${expiredAppointments.length} citas marcadas como PERDIDAS. ${sentCount} recordatorios enviados.`,
    });

  } catch (error) {
    console.error('[Cron Expired] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error al procesar las citas vencidas' },
      { status: 500 }
    );
  }
}
