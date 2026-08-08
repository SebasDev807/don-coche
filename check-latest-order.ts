import 'dotenv/config';
import { prisma } from './lib/prisma';

async function main() {
  const latestOrder = await prisma.order.findFirst({
    where: { status: 'FACTURADA' },
    include: {
      services: {
        include: { service: true }
      },
      products: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  if (latestOrder) {
    console.log(`Latest Order: ${latestOrder.orderNumber}`);
    console.log('Services:');
    latestOrder.services.forEach(s => {
      console.log(`- ${s.service?.name}: code=${s.service?.aliaddoItemCode}`);
    });
  }
}

main().catch(console.error).finally(() => process.exit(0));
