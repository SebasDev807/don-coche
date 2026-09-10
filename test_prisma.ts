import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category_rel: true
      },
      where: {
        isActive: true,
      },
      orderBy: { barCode: 'asc' },
    });
    console.log('Success:', products.length);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
