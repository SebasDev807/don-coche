import { prisma } from './lib/prisma';
import fs from 'fs';

async function main() {
  const products = await prisma.product.findMany({
    include: { purchaseItems: true }
  });
  
  // Create backup
  const backup = products.map(p => ({ id: p.id, stock: p.stock }));
  fs.writeFileSync('stock-backup.json', JSON.stringify(backup, null, 2));
  console.log('Backup saved to stock-backup.json');

  let updatedCount = 0;
  
  for (const p of products) {
    if (p.purchaseItems && p.purchaseItems.length > 0) {
      const historicalQty = p.purchaseItems.reduce((sum, item) => sum + item.quantity, 0);
      
      if (p.stock !== historicalQty) {
        await prisma.product.update({
          where: { id: p.id },
          data: { stock: historicalQty }
        });
        updatedCount++;
      }
    } else {
      // Si no tiene compras en facturas, su stock verificable es 0
      if (p.stock !== 0) {
        await prisma.product.update({
          where: { id: p.id },
          data: { stock: 0 }
        });
        updatedCount++;
      }
    }
  }

  console.log(`Successfully synced stock for ${updatedCount} products.`);
  
  // Verify new totals
  const activeProducts = await prisma.product.findMany({ where: { isActive: true } });
  let inventoryTotal = 0;
  for (const p of activeProducts) {
    inventoryTotal += Number(p.unitCost) * p.stock;
  }
  
  const agg = await prisma.purchaseInvoice.aggregate({ _sum: { grandTotal: true } });

  console.log("-----------------------------------------");
  console.log("New Inventory Total:", inventoryTotal);
  console.log("PurchaseInvoice GrandTotal:", Number(agg._sum.grandTotal));
  console.log("Difference:", inventoryTotal - Number(agg._sum.grandTotal));
  console.log("-----------------------------------------");
}

main().catch(console.error).finally(() => prisma.$disconnect());
