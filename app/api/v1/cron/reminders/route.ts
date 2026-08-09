import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendServiceReminderNotification } from '@/lib/whatsapp/whatsapp.service';

/**
 * Este endpoint está diseñado para ser llamado diariamente por un Cron Job (ej. Vercel Cron, GitHub Actions o Crontab).
 * Busca las órdenes que tienen un próximo mantenimiento programado para exactamente dentro de 7 días.
 * Si el cliente no tiene citas pendientes, le envía un recordatorio por WhatsApp.
 */
export async function GET(request: Request) {
  try {
    // Seguridad básica para Cron Jobs (Opcional pero recomendada)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    // 1. Calcular la fecha destino: Hoy + 7 días
    // Usamos UTC y truncamos la hora para comparar solo fechas
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 7);
    targetDate.setUTCHours(0, 0, 0, 0);

    const endOfTargetDate = new Date(targetDate);
    endOfTargetDate.setUTCHours(23, 59, 59, 999);

    console.log(`[Cron Reminders] Ejecutando búsqueda para mantenimientos entre ${targetDate.toISOString()} y ${endOfTargetDate.toISOString()}`);

    // 2. Buscar órdenes cuyo próximo mantenimiento caiga en ese rango
    const orders = await prisma.order.findMany({
      where: {
        nextMaintenanceDate: {
          gte: targetDate,
          lte: endOfTargetDate,
        },
      },
      include: {
        vehicle: {
          include: {
            customer: {
              include: {
                appointments: {
                  where: { status: 'PENDIENTE' }
                }
              }
            }
          }
        }
      }
    });

    if (orders.length === 0) {
      console.log('[Cron Reminders] No se encontraron mantenimientos para recordar hoy.');
      return NextResponse.json({ success: true, sentCount: 0, message: 'Sin mantenimientos para recordar.' });
    }

    let sentCount = 0;
    const processedCustomers = new Set<string>(); // Para no enviar 2 veces al mismo cliente el mismo día

    for (const order of orders) {
      const customer = order.vehicle.customer;
      
      // Si el vehículo no tiene cliente asignado, o el cliente no tiene número de teléfono, lo omitimos
      if (!customer || !customer.phone) continue;
      
      // Si ya le mandamos un mensaje en esta ejecución, lo saltamos
      if (processedCustomers.has(customer.id)) continue;

      // 3. Verificar que el cliente NO tenga citas pendientes
      if (customer.appointments.length > 0) {
        console.log(`[Cron Reminders] Cliente ${customer.name} (CC: ${customer.cc}) omitido. Ya tiene una cita pendiente.`);
        continue;
      }

      // 4. Enviar el recordatorio por WhatsApp
      const serviceReason = order.nextMaintenanceReason || 'revisión general';
      const timeframe = '1 semana';

      try {
        await sendServiceReminderNotification(customer.phone, serviceReason, timeframe);
        sentCount++;
        processedCustomers.add(customer.id);
        console.log(`[Cron Reminders] Recordatorio enviado a ${customer.name} para ${serviceReason}`);
      } catch (err) {
        console.error(`[Cron Reminders] Falló el envío a ${customer.name}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      sentCount, 
      totalFound: orders.length,
      message: `Se enviaron ${sentCount} recordatorios.` 
    });

  } catch (error: any) {
    console.error('[Cron Reminders] Error en el cron job:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
