import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany();
  let inventoryTotal = 0;
  let inventoryTotalWithIva = 0;
  for (const p of products) {
    const cost = Number(p.unitCost);
    const iva = Number(p.iva || 19) / 100;
    inventoryTotal += cost * p.stock;
    inventoryTotalWithIva += (cost * (1 + iva)) * p.stock;
  }
  
  const agg = await prisma.purchaseInvoice.aggregate({ _sum: { grandTotal: true, subtotal: true, ivaAmount: true } });
  
  const items = await prisma.purchaseInvoiceItem.findMany();
  let itemsSubtotal = 0;
  let itemsNetSubtotal = 0;
  for (const item of items) {
    itemsSubtotal += Number(item.subtotal);
    itemsNetSubtotal += Number(item.netSubtotal);
  }
  
  const moves = await prisma.inventoryMovement.groupBy({ by: ['type'], _sum: { quantity: true } });
  
  console.log("Inventory Total (unitCost * stock):", inventoryTotal);
  console.log("Inventory Total with Product IVA:", inventoryTotalWithIva);
  console.log("PurchaseInvoice GrandTotal:", agg._sum.grandTotal);
  console.log("PurchaseInvoice Subtotal:", agg._sum.subtotal);
  console.log("PurchaseInvoice IVA:", agg._sum.ivaAmount);
  console.log("Invoice Items Subtotal:", itemsSubtotal);
  console.log("Invoice Items NetSubtotal:", itemsNetSubtotal);
  console.log("Inventory Movements:", moves);
}

main().catch(console.error).finally(() => prisma.$disconnect());
