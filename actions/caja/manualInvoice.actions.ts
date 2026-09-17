'use server';

import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/dal';
import { revalidatePath } from 'next/cache';
import { PaymentMethod } from '@prisma/client';

/**
 * Crea una factura manual con monto personalizado.
 * Se registra como una ProductSale con un item virtual (sin producto real en inventario),
 * de modo que aparece en el cuadre de caja del día y en el cierre de caja.
 */
export async function createManualInvoice(data: {
  amount: number;
  description?: string;
  paymentMethod: PaymentMethod;
  customerName?: string;
  ivaRate?: number;
  plate?: string;
}) {
  try {
    const session = await verifyRole([
      'SUPERUSUARIO',
      'GERENTE',
      'ADMINISTRADOR',
      'AUXILIAR_ADMINISTRATIVO',
    ]);

    if (!data.amount || data.amount <= 0) {
      return { success: false, message: 'El monto debe ser mayor a cero.' };
    }

    // Buscar o crear un producto virtual "FACTURA MANUAL" para asociar el item
    // Usamos un producto placeholder que no afecta inventario
    let manualProduct = await prisma.product.findFirst({
      where: { slug: '__manual_invoice__' },
    });

    if (!manualProduct) {
      manualProduct = await prisma.product.create({
        data: {
          name: 'Factura Manual',
          slug: '__manual_invoice__',
          unitCost: 0,
          salePrice: 0,
          stock: 999999, // Stock "ilimitado" — nunca se descuenta
          isActive: false, // Oculto en catálogos normales
        },
      });
    }

    const grandTotal = data.amount;

    // Guardamos la descripción en customerName (+ nombre del cliente si viene)
    // para que sea visible en el cuadre de caja sin necesidad de migración de BD.
    const hasDesc = data.description && data.description.trim() !== '';
    const hasCustomer = data.customerName && data.customerName.trim() !== '';
    
    let customerNameField = '';
    if (hasDesc && hasCustomer) {
      customerNameField = `${data.description?.trim()} | ${data.customerName?.trim()}`;
    } else if (hasDesc) {
      customerNameField = data.description!.trim();
    } else if (hasCustomer) {
      customerNameField = data.customerName!.trim();
    } else {
      customerNameField = 'Ingreso Personalizado';
    }

    const finalPlate = data.plate?.trim() ? data.plate.trim().toUpperCase() : 'N/A';
    const storedName = `[${finalPlate}] ${customerNameField}`;

    const ivaRate = data.ivaRate || 0;
    const subtotal = ivaRate > 0 ? grandTotal / (1 + (ivaRate / 100)) : grandTotal;
    const ivaAmount = grandTotal - subtotal;

    const sale = await prisma.productSale.create({
      data: {
        adminId: session.userId,
        customerName: storedName,
        paymentMethod: data.paymentMethod,
        subtotal: subtotal,
        ivaAmount: ivaAmount,
        grandTotal,
        items: {
          create: {
            productId: manualProduct.id,
            quantity: 1,
            unitPrice: grandTotal,
            unitCost: 0,
            ivaRate: ivaRate,
          },
        },
      },
      include: {
        admin: { select: { name: true } }
      }
    });

    revalidatePath('/caja');
    revalidatePath('/');

    return {
      success: true,
      message: 'Factura manual registrada correctamente.',
      saleNumber: sale.saleNumber,
      adminName: sale.admin?.name || 'Sistema'
    };
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT') throw error;
    console.error('[createManualInvoice] Error:', error);
    return { success: false, message: error.message || 'Error al crear la factura manual.' };
  }
}
