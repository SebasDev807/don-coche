import { prisma } from './lib/prisma';

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      purchaseItems: {
        include: {
          invoice: true,
        },
        orderBy: {
          invoice: { date: 'desc' },
        },
        take: 1,
      }
    }
  });

  let updatedCount = 0;
  
  for (const p of products) {
    if (p.purchaseItems && p.purchaseItems.length > 0) {
      const item = p.purchaseItems[0];
      const invoice = item.invoice;
      
      const invoiceNetSubtotal = Number(invoice.subtotal) - (Number(invoice.discountAmount) || 0);
      const itemNetSubtotal = Number(item.netSubtotal) || (Number(item.subtotal) - (Number(item.discountAmount) || 0));
      
      let proportionalIva = 0;
      if (invoiceNetSubtotal > 0 && Number(invoice.ivaAmount) > 0) {
        proportionalIva = (itemNetSubtotal / invoiceNetSubtotal) * Number(invoice.ivaAmount);
      }
      
      const totalItemCost = itemNetSubtotal + proportionalIva;
      const realUnitCost = totalItemCost / item.quantity;
      
      await prisma.product.update({
        where: { id: p.id },
        data: { unitCost: realUnitCost }
      });
      
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} products.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
