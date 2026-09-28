import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
    
    // We update all products to their real net cost
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
          data: {
            unitCost: realUnitCost
          }
        });
        
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} products with real net cost (including proportional IVA and discounts).`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
