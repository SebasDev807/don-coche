'use server';

import { prisma } from '@/lib/prisma';
import { verifySession, verifyRole } from '@/lib/dal';
import { revalidatePath } from 'next/cache';
import { PaymentMethod } from '@prisma/client';

export async function getPendingOrders() {
  try {
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

    const orders = await prisma.order.findMany({
      where: { status: 'EN_PISTA' },
      include: {
        vehicle: true,
        technician: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: orders.map(order => ({
        ...order,
        totalServices: Number(order.totalServices),
        totalProducts: Number(order.totalProducts),
        grandTotal: Number(order.grandTotal),
      }))
    };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || 'Error al obtener órdenes', data: [] };
  }
}

export async function getOrderDetail(orderId: string) {
  try {
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vehicle: { include: { customer: true } },
        technician: { select: { name: true } },
        services: {
          include: { service: true }
        },
        products: {
          include: { product: true }
        }
      }
    });

    if (!order) return { success: false, message: 'Orden no encontrada' };

    return {
      success: true,
      data: {
        ...order,
        totalServices: Number(order.totalServices),
        totalProducts: Number(order.totalProducts),
        grandTotal: Number(order.grandTotal),
        services: order.services.map(s => ({ ...s, chargedPrice: Number(s.chargedPrice) })),
        products: order.products.map(p => ({ ...p, unitPrice: Number(p.unitPrice), unitCost: Number(p.unitCost) }))
      }
    };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || 'Error al cargar orden' };
  }
}

export async function billOrder(orderId: string, paymentMethod: PaymentMethod) {
  try {
    const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);
    
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { products: true }
      });

      if (!order || order.status !== 'EN_PISTA') {
        throw new Error('La orden no está en pista o no existe.');
      }

      // Descontar inventario por cada producto de la orden
      for (const op of order.products) {
        const product = await tx.product.findUnique({ where: { id: op.productId } });
        if (!product) throw new Error(`Producto ${op.productId} no encontrado.`);

        const newStock = product.stock - op.quantity;
        
        await tx.product.update({
          where: { id: op.productId },
          data: { stock: newStock }
        });

        await tx.inventoryMovement.create({
          data: {
            productId: op.productId,
            adminId: session.userId,
            type: 'VENTA',
            quantity: -op.quantity,
            previousStock: product.stock,
            newStock: newStock,
            reason: `Venta Orden #${order.orderNumber}`
          }
        });
      }

      // Actualizar Orden
      return await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'FACTURADA',
          paymentMethod,
          adminId: session.userId,
          billedAt: new Date()
        }
      });
    });

    revalidatePath('/caja');
    revalidatePath('/dashboard');
    return { success: true, message: 'Orden facturada correctamente', data: updatedOrder };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || 'Error al facturar' };
  }
}

export async function cancelOrder(orderId: string) {
  try {
    const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELADA',
        adminId: session.userId
      }
    });

    revalidatePath('/caja');
    return { success: true, message: 'Orden cancelada exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al cancelar' };
  }
}

export async function getTodayBilledOrders() {
  try {
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

    // Get start and end of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        status: 'FACTURADA',
        billedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        vehicle: true
      },
      orderBy: { billedAt: 'desc' }
    });

    return {
      success: true,
      data: orders.map(order => ({
        ...order,
        totalServices: Number(order.totalServices),
        totalProducts: Number(order.totalProducts),
        grandTotal: Number(order.grandTotal),
      }))
    };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: 'Error al obtener cuadre de hoy', data: [] };
  }
}
