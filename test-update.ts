import { prisma } from './lib/prisma';

async function main() {
  const p = await prisma.product.findFirst();
  if (!p) {
    console.log("No product");
    return;
  }
  console.log("Updating product", p.id);
  try {
    await prisma.product.update({
      where: { id: p.id },
      data: { categoryId: "11111111-1111-1111-1111-111111111111" }
    });
    console.log("Success");
  } catch (e: any) {
    console.log("Error code:", e.code);
    console.log("Error message:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
