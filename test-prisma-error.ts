import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst();
  if (!p) return;
  try {
    await prisma.product.update({
      where: { id: p.id },
      data: { categoryId: "11111111-1111-1111-1111-111111111111" }
    });
  } catch (e: any) {
    console.log("Error code:", e.code);
    console.log("Message:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
