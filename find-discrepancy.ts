import { prisma } from './lib/prisma';

async function main() {
  const products = await prisma.product.findMany({ include: { purchaseItems: { include: { invoice: true } } } });
  
  let discrepancyLog = [];
  let totalMissing = 0;
  let manualStockTotal = 0;
  let inactiveStockTotal = 0;
  let priceDifferenceTotal = 0;
  
  for (const p of products) {
    // Current valuation
    const currentValuation = Number(p.unitCost) * p.stock;
    
    if (!p.isActive) {
      if (p.purchaseItems.length > 0) {
        inactiveStockTotal += currentValuation;
      }
      continue;
    }
    
    if (p.purchaseItems.length === 0) {
      if (p.stock > 0) {
        manualStockTotal += currentValuation;
      }
      continue;
    }
    
    // Historical valuation for this product
    let historicalValuation = 0;
    let historicalQty = 0;
    
    for (const item of p.purchaseItems) {
      const invoice = item.invoice;
      const invoiceNetSubtotal = Number(invoice.subtotal) - (Number(invoice.discountAmount) || 0);
      const itemNetSubtotal = Number(item.netSubtotal) || (Number(item.subtotal) - (Number(item.discountAmount) || 0));
      
      let proportionalIva = 0;
      if (invoiceNetSubtotal > 0 && Number(invoice.ivaAmount) > 0) {
        proportionalIva = (itemNetSubtotal / invoiceNetSubtotal) * Number(invoice.ivaAmount);
      }
      
      const totalItemCost = itemNetSubtotal + proportionalIva;
      historicalValuation += totalItemCost;
      historicalQty += item.quantity;
    }
    
    const diff = historicalValuation - currentValuation;
    if (Math.abs(diff) > 1) { // more than 1 peso diff
      priceDifferenceTotal += diff;
      discrepancyLog.push({
        product: p.name,
        historicalValuation,
        currentValuation,
        diff,
        historicalQty,
        currentStock: p.stock
      });
    }
  }
  
  console.log("Inactive Stock Total (purchases exist but excluded from inventory):", inactiveStockTotal);
  console.log("Manual Stock Total (no purchases, but has stock in inventory):", manualStockTotal);
  console.log("Price Difference Total (Historical Purchases - Current Valuation):", priceDifferenceTotal);
  
  console.log("\nTop differences (due to multiple purchases at different prices or stock mismatches):");
  discrepancyLog.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  console.table(discrepancyLog.slice(0, 10));
}

main().catch(console.error).finally(() => prisma.$disconnect());
