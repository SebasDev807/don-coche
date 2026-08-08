import 'dotenv/config';
import { prisma } from './lib/prisma';

async function main() {
  const latestOrder = await prisma.order.findUnique({
    where: { orderNumber: 57 },
    include: {
      services: {
        include: { service: true }
      }
    }
  });

  if (latestOrder) {
    console.log(`Order: ${latestOrder.orderNumber}`);
    latestOrder.services.forEach(s => {
      console.log(`- ${s.service?.name}: code=${s.service?.aliaddoItemCode}, price=${s.chargedPrice}`);
    });
  }
}

main().catch(console.error).finally(() => process.exit(0));
