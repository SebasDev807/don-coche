import { prisma } from './lib/prisma';
async function run() {
  const orders = await prisma.order.findMany({
    where: { nextMaintenanceDate: { not: null } },
    select: { id: true, nextMaintenanceDate: true }
  });
  console.log(orders);
}
run();
