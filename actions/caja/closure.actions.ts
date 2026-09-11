'use server';

import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/dal';
import { revalidatePath } from 'next/cache';

export async function getClosureSummary() {
  try {
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

    // Find all billed orders that haven't been closed yet
    const pendingClosureOrders = await prisma.order.findMany({
      where: {
        status: 'FACTURADA',
        cashClosureId: null,
      },
    });

    // Find all product sales from almacén that haven't been closed yet
    const pendingProductSales = await prisma.productSale.findMany({
      where: { cashClosureId: null },
    });

    let totalCash = 0;
    let totalCard = 0;
    let totalTransfer = 0;

    for (const order of pendingClosureOrders) {
      const amount = Number(order.grandTotal);
      if (order.paymentMethod === 'EFECTIVO') totalCash += amount;
      else if (order.paymentMethod === 'TARJETA') totalCard += amount;
      else if (order.paymentMethod === 'TRANSFERENCIA') totalTransfer += amount;
    }

    for (const sale of pendingProductSales) {
      const amount = Number(sale.grandTotal);
      if (sale.paymentMethod === 'EFECTIVO') totalCash += amount;
      else if (sale.paymentMethod === 'TARJETA') totalCard += amount;
      else if (sale.paymentMethod === 'TRANSFERENCIA') totalTransfer += amount;
    }

    return {
      success: true,
      data: {
        totalCash,
        totalCard,
        totalTransfer,
        orderIds: pendingClosureOrders.map(o => o.id),
        saleIds: pendingProductSales.map(s => s.id),
      },
    };
  } catch (error: any) {
    console.error('[getClosureSummary] Error:', error);
    return { success: false, message: error.message };
  }
}

export async function closeCashRegister(data: {
  reportedCash: number;
  totalCash: number;
  totalCard: number;
  totalTransfer: number;
  observations: string;
  orderIds: string[];
  saleIds?: string[];
}) {
  try {
    const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

    const hasOrders = data.orderIds && data.orderIds.length > 0;
    const hasSales = data.saleIds && data.saleIds.length > 0;

    if (!hasOrders && !hasSales) {
      return { success: false, message: 'No hay movimientos pendientes por cerrar.' };
    }

    const discrepancy = data.reportedCash - data.totalCash;

    const closure = await prisma.$transaction(async (tx) => {
      // Create closure record
      const newClosure = await tx.cashClosure.create({
        data: {
          totalCash: data.totalCash,
          totalCard: data.totalCard,
          totalTransfer: data.totalTransfer,
          reportedCash: data.reportedCash,
          discrepancy,
          observations: data.observations,
          adminId: session.userId as string,
        },
      });

      // Update orders
      if (hasOrders) {
        await tx.order.updateMany({
          where: { id: { in: data.orderIds } },
          data: { cashClosureId: newClosure.id },
        });
      }

      // Update product sales from almacén
      if (hasSales) {
        await tx.productSale.updateMany({
          where: { id: { in: data.saleIds! } },
          data: { cashClosureId: newClosure.id },
        });
      }

      return newClosure;
    });

    revalidatePath('/caja');
    revalidatePath('/');

    return { success: true, closureId: closure.id };
  } catch (error: any) {
    console.error('[closeCashRegister] Error:', error);
    return { success: false, message: error.message };
  }
}
