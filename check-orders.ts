import 'dotenv/config';
import { prisma } from './lib/prisma';

async function main() {
  const o = await prisma.order.findUnique({
    where: { orderNumber: 56 },
    include: {
      services: {
        include: { service: true }
      }
    }
  });

  console.log(o?.services.map(s => ({
    name: s.service?.name,
    code: s.service?.aliaddoItemCode
  })));
}

main().catch(console.error).finally(() => process.exit(0));
