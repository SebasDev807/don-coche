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

    // 1. Calcular la fecha destino: Hoy (local) + 7 días -> a las 00:00 UTC
    const today = new Date();
    const targetDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 7));

    const endOfTargetDate = new Date(targetDate);
    endOfTargetDate.setUTCHours(23, 59, 59, 999);

    // Para depuración: buscar cualquier orden con nextMaintenanceDate futuro
    const allFutureOrders = await prisma.order.findMany({
      where: {
        nextMaintenanceDate: { not: null }
      },
      select: { id: true, orderNumber: true, nextMaintenanceDate: true, nextMaintenanceReason: true }
    });




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

      return NextResponse.json({ 
        success: true, 
        sentCount: 0, 
        totalFound: 0,
        allFutureDates: allFutureOrders.map(o => o.nextMaintenanceDate),
        message: 'Sin mantenimientos para recordar.' 
      });
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

        continue;
      }

      // 4. Enviar el recordatorio por WhatsApp
      const serviceReason = order.nextMaintenanceReason || 'revisión general';
      const timeframe = '1 semana';

      try {
        await sendServiceReminderNotification(customer.phone, serviceReason, timeframe);
        sentCount++;
        processedCustomers.add(customer.id);

      } catch (err) {
        console.error(`[Cron Reminders] Falló el envío a ${customer.name}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      sentCount, 
      totalFound: orders.length,
      allFutureDates: allFutureOrders.map(o => o.nextMaintenanceDate),
      message: `Se enviaron ${sentCount} recordatorios.` 
    });

  } catch (error: any) {
    console.error('[Cron Reminders] Error en el cron job:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
