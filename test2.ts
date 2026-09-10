import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const p = await prisma.product.findMany({
      include: {
        category_rel: true
      },
      where: {
        isActive: true,
      },
      orderBy: { barCode: 'asc' },
    });
    console.log("Found:", p.length);
  } catch(e) {
    console.error("FAIL:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
