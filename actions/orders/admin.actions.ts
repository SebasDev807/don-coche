'use server';

import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/dal';
import { revalidatePath } from 'next/cache';
import { PaymentMethod } from '@prisma/client';
import { after } from 'next/server';
import { sendReceiptNotification, sendNextAppointmentNotification, sendServiceReminderNotification, type OrderReceiptData } from '@/lib/whatsapp';


import { AliaddoService, AliaddoInvoicePayload } from '@/lib/services/aliaddo';
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
        services: order.services.map(s => ({
          ...s,
          chargedPrice: Number(s.chargedPrice),
          service: s.service ? {
            ...s.service,
            basePrice: Number(s.service.basePrice)
          } : s.service
        })),
        products: order.products.map(p => ({
          ...p,
          unitPrice: Number(p.unitPrice),
          unitCost: Number(p.unitCost),
          product: p.product ? {
            ...p.product,
            unitCost: Number(p.product.unitCost),
            salePrice: Number(p.product.salePrice),
            profitPercentage: p.product.profitPercentage ? Number(p.product.profitPercentage) : null
          } : p.product
        }))
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

      if (order.aliaddoInvoiceId || order.cufe) {
        throw new Error('La orden ya cuenta con una factura electrónica emitida.');
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

      // Actualizar Orden y devolver con relaciones para el recibo
      const updatedOrderTx = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'FACTURADA',
          paymentMethod,
          adminId: session.userId,
          billedAt: new Date()
        },
        include: {
          vehicle: { include: { customer: true } },
          technician: { select: { name: true } },
          admin: { select: { name: true } },
          services: { include: { service: true } },
          products: { include: { product: true } },
        }
      });

      return updatedOrderTx;
    });

    // =========================================================================
    // BLOQUE ALIADDO - Facturación Electrónica (No bloqueante)
    // =========================================================================
    let aliaddoConsecutive: string | null = null;
    try {
      const isCard = paymentMethod === 'TARJETA';
      const isTransfer = paymentMethod === 'TRANSFERENCIA';
      // Mapeo básico de método de pago (requiere validación con contador)
      const paymentMeanCode = isCard ? '48' : (isTransfer ? '47' : '10');

      // Mapeo de items usando los códigos reales sincronizados con Aliaddo
      // Si un servicio no tiene código (no fue sincronizado), usamos AGUA como fallback
      const FALLBACK_CODE = 'AGUA';
      const details = [
        ...updatedOrder.services.map(s => ({
          unitValueBeforeTax: Number(s.chargedPrice),
          quantity: 1,
          description: s.service?.name || 'Servicio Automotriz',
          itemCode: s.service?.aliaddoItemCode || FALLBACK_CODE,
          discountAmount: 0,
          discountIsPercent: true
        })),
        ...updatedOrder.products.map(p => ({
          unitValueBeforeTax: Number(p.unitPrice),
          quantity: p.quantity,
          description: p.product?.name || 'Producto',
          itemCode: FALLBACK_CODE, // Los productos se mapearán con el contador
          discountAmount: 0,
          discountIsPercent: true
        }))
      ];


      // Obtener fecha actual en zona horaria local (Colombia) para evitar error FAD09e de la DIAN
      const now = new Date();
      // Formato YYYY-MM-DD ajustado a la zona horaria local (restando offset)
      const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      const invoicePayload: AliaddoInvoicePayload = {
        date: localDate,
        dueDate: localDate,
        paymentFormCode: 'CR', // Contado por defecto
        paymentMeanCode: paymentMeanCode,
        currencyCode: 'COP',
        personId: '1b117033-c258-4b88-b59c-f137fa3a316d', // Person ID válido extraído de Aliaddo
        branchId: '8ffca1e5-8f58-11f1-8ea2-42010a26ccd5', // Sucursal válida
        details: details,
        ...(updatedOrder.vehicle.customer?.email ? {
          customer: { email: updatedOrder.vehicle.customer.email }
        } : {})
      };

      // Llamada real a Aliaddo
      const aliaddoResponse = await AliaddoService.createInvoice(invoicePayload);

      // Guardar el ID de Aliaddo Y el CUFE (identificador DIAN) en la BD
      await prisma.order.update({
        where: { id: updatedOrder.id },
        data: {
          aliaddoInvoiceId: aliaddoResponse.id,
          cufe: aliaddoResponse.cufe || null,
          aliaddoInvoiceStatus: aliaddoResponse.stateDian || aliaddoResponse.status || 'PROCESADA',
        }
      });
      console.log('📝 [ALIADDO] Factura creada exitosamente:', {
        id: aliaddoResponse.id,
        consecutive: aliaddoResponse.consecutive,
        stateDian: aliaddoResponse.stateDian,
        cufe: aliaddoResponse.cufe?.substring(0, 20) + '...',
      });

      // Actualizamos el objeto en memoria para que el modal lo reciba
      updatedOrder.aliaddoInvoiceId = aliaddoResponse.id;
      updatedOrder.cufe = aliaddoResponse.cufe || null;
      (updatedOrder as any).aliaddoInvoiceStatus = aliaddoResponse.stateDian || aliaddoResponse.status || 'PROCESADA';
      aliaddoConsecutive = aliaddoResponse.consecutive || null;

    } catch (aliaddoError: any) {
      console.error('❌ Error enviando a Aliaddo (la orden local sí se guardó):', aliaddoError.message);
      (updatedOrder as any).aliaddoInvoiceStatus = 'ERROR';
      (updatedOrder as any).aliaddoErrorMessage = aliaddoError.message;
    }
    // =========================================================================

    revalidatePath('/caja');
    revalidatePath('/dashboard');

    const receiptData: OrderReceiptData = {
      orderId: updatedOrder.id,
      phone: updatedOrder.vehicle.customer?.phone,
      customerName: updatedOrder.vehicle.customer?.name,
      vehiclePlate: updatedOrder.vehicle.plate,
      orderNumber: updatedOrder.orderNumber,
      grandTotal: Number(updatedOrder.grandTotal),
    };

    after(async () => {
      try {
        await sendReceiptNotification(receiptData);

        // Esperar 8 segundos para asegurar que WhatsApp entregue primero la factura (PDF es mucho más pesado y la API de Meta lo procesa lento)
        await new Promise(resolve => setTimeout(resolve, 8000));

        if (updatedOrder.nextMaintenanceDate && receiptData.phone) {
          const targetDate = new Date(updatedOrder.nextMaintenanceDate);
          const now = new Date();
          const diffTime = targetDate.getTime() - now.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          let timeText = 'unas semanas';
          if (diffDays <= 8) timeText = '1 semana';
          else if (diffDays <= 16) timeText = '15 días';
          else if (diffDays <= 32) timeText = '1 mes';
          else if (diffDays <= 63) timeText = '2 meses';
          else if (diffDays <= 95) timeText = '3 meses';
          else if (diffDays <= 125) timeText = '4 meses';
          else if (diffDays <= 186) timeText = '6 meses';
          else timeText = 'unos meses';

          // Usamos el template de "recordatorio_proximo_servicio" recién arreglado
          const serviceReason = updatedOrder.nextMaintenanceReason || 'revisión general';
          await sendServiceReminderNotification(receiptData.phone, serviceReason, timeText);
        }
      } catch (err) {
        console.error('[billOrder] Error al enviar notificaciones WhatsApp:', err);
      }
    });

    return {
      success: true,
      message: 'Orden facturada correctamente',
      aliaddoSuccess: updatedOrder.aliaddoInvoiceId ? true : false,
      aliaddoStatus: (updatedOrder as any).aliaddoInvoiceStatus || null,
      aliaddoError: (updatedOrder as any).aliaddoErrorMessage || null,
      data: {
        ...updatedOrder,
        totalServices: Number(updatedOrder.totalServices),
        totalProducts: Number(updatedOrder.totalProducts),
        grandTotal: Number(updatedOrder.grandTotal),
        // Consecutivo de Aliaddo para mostrarlo en el modal (Ej: FEDC2)
        aliaddoConsecutive: aliaddoConsecutive,
        services: updatedOrder.services.map((s: any) => ({
          ...s,
          chargedPrice: Number(s.chargedPrice),
          service: s.service ? {
            ...s.service,
            basePrice: Number(s.service.basePrice)
          } : s.service
        })),
        products: updatedOrder.products.map((p: any) => ({
          ...p,
          unitPrice: Number(p.unitPrice),
          unitCost: Number(p.unitCost),
          product: p.product ? {
            ...p.product,
            unitCost: Number(p.product.unitCost),
            salePrice: Number(p.product.salePrice),
            profitPercentage: p.product.profitPercentage ? Number(p.product.profitPercentage) : null
          } : p.product
        })),
      }
    };
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

export async function getPendingOrdersCount() {
  try {
    // Only check if they have access to avoid throwing for unauthenticated sidebar checks, or just use verifyRole
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

    const count = await prisma.order.count({
      where: { status: 'EN_PISTA' }
    });

    return { success: true, count };
  } catch (error: any) {
    console.error('Error fetching pending orders count:', error);
    return { success: false, count: 0 };
  }
}
