import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({ where: { isActive: true } });
    let inventoryTotal = 0;
    
    for (const p of products) {
      const cost = Number(p.unitCost);
      inventoryTotal += cost * p.stock;
    }

    return NextResponse.json({
      inventoryTotalActive: inventoryTotal
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
