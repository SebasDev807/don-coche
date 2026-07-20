import { prisma } from './lib/prisma';
async function test() {
  const order = await prisma.order.findUnique({ where: { id: 'bf098d8a-741f-46e0-8c8e-dff2432ed2ec' } });
  console.log(order);
}
test();
