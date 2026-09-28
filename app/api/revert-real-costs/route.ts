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

    let revertedCount = 0;
    
    // We update all products to their original gross cost
    for (const p of products) {
      if (p.purchaseItems && p.purchaseItems.length > 0) {
        const item = p.purchaseItems[0];
        
        await prisma.product.update({
          where: { id: p.id },
          data: {
            unitCost: Number(item.unitCost)
          }
        });
        
        revertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reverted ${revertedCount} products to their original gross cost.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
