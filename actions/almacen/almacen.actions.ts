'use server';

import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/dal';
import { revalidatePath } from 'next/cache';
import { PaymentMethod } from '@prisma/client';
import { AliaddoService, AliaddoInvoicePayload } from '@/lib/services/aliaddo';

/** Producto enriquecido para la UI de almacén */
export interface AlmacenProduct {
  id: string;
  name: string;
  barCode: string | null;
  description: string | null;
  stock: number;
  salePrice: number;
  unitCost: number;
  iva: number; // % IVA (0 si no aplica)
  category: string | null;
  imageUrl: string | null;
}

/** Ítem del carrito enviado desde el cliente */
export interface SaleCartItem {
  productId: string;
  quantity: number;
}

/**
 * Retorna todos los productos activos con stock > 0.
 * Se ordena por nombre para facilitar la búsqueda visual.
 */
export async function getAlmacenProducts() {
  try {
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

    const products = await prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        barCode: p.barCode,
        description: p.description,
        stock: p.stock,
        salePrice: Number(p.salePrice),
        unitCost: Number(p.unitCost),
        iva: p.iva ? Number(p.iva) : 0,
        category: p.category,
        imageUrl: p.imageUrl,
      })) as AlmacenProduct[],
    };
  } catch (error: any) {
    console.error('[getAlmacenProducts] Error:', error);
    return { success: false, message: error.message, data: [] as AlmacenProduct[] };
  }
}

/**
 * Crea una venta de almacén:
 * 1. Verifica stock de cada producto
 * 2. Crea ProductSale + ProductSaleItems en una transacción
 * 3. Descuenta inventario y registra movimientos
 * 4. Si emitirFactura=true, llama a Aliaddo
 */
export async function createProductSale(params: {
  items: SaleCartItem[];
  paymentMethod: PaymentMethod;
  emitirFactura: boolean;
  customerName?: string;
  customerCc?: string;
}) {
  try {
    const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);
    const { items, paymentMethod, emitirFactura, customerName, customerCc } = params;

    if (!items || items.length === 0) {
      return { success: false, message: 'El carrito está vacío' };
    }

    // Obtener productos de BD para precios inmutables
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== items.length) {
      return { success: false, message: 'Uno o más productos no son válidos' };
    }

    // Verificar stock antes de la transacción
    for (const item of items) {
      const p = products.find((p) => p.id === item.productId);
      if (!p) return { success: false, message: `Producto no encontrado` };
      if (p.stock < item.quantity) {
        return { success: false, message: `Stock insuficiente para "${p.name}" (disponible: ${p.stock})` };
      }
    }

    // Calcular totales respetando IVA por producto
    let subtotal = 0;
    let ivaAmount = 0;

    const saleItemsData = items.map((item) => {
      const p = products.find((p) => p.id === item.productId)!;
      const unitPrice = Number(p.salePrice);
      const unitCost = Number(p.unitCost);
      const ivaRate = p.iva ? Number(p.iva) : 0;
      const lineSubtotal = unitPrice * item.quantity;
      const lineIva = (lineSubtotal * ivaRate) / 100;

      subtotal += lineSubtotal;
      ivaAmount += lineIva;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        unitCost,
        ivaRate,
        lineSubtotal,
      };
    });

    const grandTotal = subtotal + ivaAmount;

    // Transacción: crear venta + descontar inventario
    // timeout: 15s para conexiones Neon con latencia de red
    const newSale = await prisma.$transaction(async (tx) => {
      const sale = await tx.productSale.create({
        data: {
          adminId: session.userId,
          customerName: customerName || null,
          customerCc: customerCc || null,
          paymentMethod,
          subtotal,
          ivaAmount,
          grandTotal,
          items: {
            create: saleItemsData.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost,
              ivaRate: item.ivaRate,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          admin: { select: { name: true } },
        },
      });

      // Descontar stock en paralelo (sin loop secuencial)
      await Promise.all(
        saleItemsData.map((item) => {
          const product = products.find((p) => p.id === item.productId)!;
          return tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        })
      );

      // Registrar movimientos de inventario en lote
      await tx.inventoryMovement.createMany({
        data: saleItemsData.map((item) => {
          const product = products.find((p) => p.id === item.productId)!;
          return {
            productId: item.productId,
            adminId: session.userId,
            type: 'VENTA' as const,
            quantity: -item.quantity,
            previousStock: product.stock,
            newStock: product.stock - item.quantity,
            reason: `Venta Almacén #${sale.saleNumber}`,
          };
        }),
      });

      return sale;
    }, { timeout: 15000 });


    // =========================================================================
    // BLOQUE ALIADDO — Facturación Electrónica (Opcional)
    // =========================================================================
    let aliaddoConsecutive: string | null = null;

    if (emitirFactura) {
      try {
        const isCard = paymentMethod === 'TARJETA';
        const isTransfer = paymentMethod === 'TRANSFERENCIA';
        const paymentMeanCode = isCard ? '48' : isTransfer ? '47' : '10';

        const FALLBACK_CODE = 'AGUA';
        const now = new Date();
        const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0];

        const invoicePayload: AliaddoInvoicePayload = {
          date: localDate,
          dueDate: localDate,
          paymentFormCode: 'CR',
          paymentMeanCode,
          currencyCode: 'COP',
          personId: '1b117033-c258-4b88-b59c-f137fa3a316d',
          branchId: '8ffca1e5-8f58-11f1-8ea2-42010a26ccd5',
          details: newSale.items.map((item) => ({
            unitValueBeforeTax: Number(item.unitPrice),
            quantity: item.quantity,
            description: item.product.name,
            itemCode: FALLBACK_CODE,
            discountAmount: 0,
            discountIsPercent: true,
            // IVA por ítem si aplica
            ...(Number(item.ivaRate) > 0
              ? { taxes: [{ id: 'IVA_19' }] }
              : {}),
          })),
        };

        const aliaddoResponse = await AliaddoService.createInvoice(invoicePayload);

        await prisma.productSale.update({
          where: { id: newSale.id },
          data: {
            aliaddoInvoiceId: aliaddoResponse.id,
            cufe: aliaddoResponse.cufe || null,
            aliaddoInvoiceStatus: aliaddoResponse.stateDian || aliaddoResponse.status || 'PROCESADA',
            aliaddoConsecutive: aliaddoResponse.consecutive || null,
          },
        });

        aliaddoConsecutive = aliaddoResponse.consecutive || null;
        (newSale as any).aliaddoInvoiceId = aliaddoResponse.id;
        (newSale as any).cufe = aliaddoResponse.cufe || null;
        (newSale as any).aliaddoInvoiceStatus = aliaddoResponse.stateDian || aliaddoResponse.status || 'PROCESADA';
      } catch (aliaddoError: any) {
        console.error('[Aliaddo] Error:', aliaddoError.message);
        (newSale as any).aliaddoInvoiceStatus = 'ERROR';
        (newSale as any).aliaddoErrorMessage = aliaddoError.message;
      }
    } else {
      (newSale as any).aliaddoInvoiceStatus = 'OMITIDA';
    }
    // =========================================================================

    revalidatePath('/almacen');
    revalidatePath('/caja');
    revalidatePath('/');

    return {
      success: true,
      message: 'Venta registrada correctamente',
      aliaddoSuccess: !!(newSale as any).cufe,
      aliaddoStatus: (newSale as any).aliaddoInvoiceStatus || null,
      aliaddoError: (newSale as any).aliaddoErrorMessage || null,
      data: {
        id: newSale.id,
        saleNumber: newSale.saleNumber,
        soldAt: newSale.soldAt,
        paymentMethod: newSale.paymentMethod,
        customerName: newSale.customerName,
        subtotal: Number(newSale.subtotal),
        ivaAmount: Number(newSale.ivaAmount),
        grandTotal: Number(newSale.grandTotal),
        aliaddoConsecutive,
        aliaddoInvoiceId: (newSale as any).aliaddoInvoiceId || null,
        cufe: (newSale as any).cufe || null,
        aliaddoInvoiceStatus: (newSale as any).aliaddoInvoiceStatus || null,
        aliaddoErrorMessage: (newSale as any).aliaddoErrorMessage || null,
        admin: newSale.admin,
        items: newSale.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          ivaRate: Number(item.ivaRate),
          product: { name: item.product.name },
        })),
      },
    };
  } catch (error: any) {
    console.error('[createProductSale] Error:', error);
    return { success: false, message: error.message || 'Error al registrar la venta' };
  }
}

/** Ventas de almacén del día para el cuadre de caja */
export async function getTodayProductSales() {
  try {
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await prisma.productSale.findMany({
      where: {
        soldAt: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { soldAt: 'desc' },
    });

    return {
      success: true,
      data: sales.map((s) => ({
        id: s.id,
        saleNumber: s.saleNumber,
        paymentMethod: s.paymentMethod,
        grandTotal: Number(s.grandTotal),
        soldAt: s.soldAt,
        customerName: s.customerName,
      })),
    };
  } catch (error: any) {
    return { success: false, message: error.message, data: [] };
  }
}
