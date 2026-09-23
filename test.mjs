import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst();
  if (!p) {
    console.log("No product found");
    return;
  }
  try {
    await prisma.product.update({
      where: { id: p.id },
      data: { categoryId: "11111111-1111-1111-1111-111111111111" }
    });
  } catch (e) {
    console.log("Code:", e.code);
    console.log("Message:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
