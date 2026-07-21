// TODO: Eliminar este script y el timer asociado una vez que se configure un CRON en producción (ej. Vercel Cron)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando limpieza de órdenes antiguas...');
  
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  try {
    const staleOrders = await prisma.order.findMany({
      where: {
        status: 'EN_PISTA',
        createdAt: {
          lt: oneDayAgo,
        },
      },
      select: { id: true },
    });

    if (staleOrders.length === 0) {
      console.log('No hay órdenes antiguas (EN_PISTA y >24h) para eliminar.');
      return;
    }

    const orderIds = staleOrders.map((o) => o.id);
    console.log(`Se encontraron ${orderIds.length} órdenes para eliminar.`);

    await prisma.$transaction([
      prisma.orderService.deleteMany({ where: { orderId: { in: orderIds } } }),
      prisma.orderProduct.deleteMany({ where: { orderId: { in: orderIds } } }),
      prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
    ]);

    console.log('Las órdenes fueron eliminadas exitosamente.');
  } catch (error) {
    console.error('Error al eliminar órdenes antiguas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
