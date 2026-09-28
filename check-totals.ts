import { prisma } from './lib/prisma';

async function main() {
  const products = await prisma.product.findMany({ where: { isActive: true } });
  let inventoryTotal = 0;
  for (const p of products) {
    inventoryTotal += Number(p.unitCost) * p.stock;
  }
  
  const agg = await prisma.purchaseInvoice.aggregate({ _sum: { grandTotal: true } });

  console.log("New Inventory Total:", inventoryTotal);
  console.log("PurchaseInvoice GrandTotal:", agg._sum.grandTotal);
}

main().catch(console.error).finally(() => prisma.$disconnect());
