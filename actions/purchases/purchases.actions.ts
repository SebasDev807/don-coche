"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type PurchaseItemInput = {
  productId: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
};

export async function createPurchaseInvoiceAction(data: {
  supplierId: string;
  invoiceNumber: string;
  date: Date;
  subtotal: number;
  ivaAmount: number;
  grandTotal: number;
  adminId: string;
  notes?: string;
  items: PurchaseItemInput[];
}) {
  try {
    const existingInvoice = await prisma.purchaseInvoice.findFirst({
      where: {
        supplierId: data.supplierId,
        invoiceNumber: data.invoiceNumber,
      },
    });

    if (existingInvoice) {
      return {
        success: false,
        error: "Ya existe una factura registrada con ese número para este proveedor.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the purchase invoice and its items
      const invoice = await tx.purchaseInvoice.create({
        data: {
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber,
          date: data.date,
          subtotal: data.subtotal,
          ivaAmount: data.ivaAmount,
          grandTotal: data.grandTotal,
          adminId: data.adminId,
          notes: data.notes,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              subtotal: item.subtotal,
            })),
          },
        },
      });

      // 2. Update inventory and prices for each item
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Producto con ID ${item.productId} no encontrado.`);
        }

        const previousStock = product.stock;
        const newStock = previousStock + item.quantity;
        
        const oldUnitCost = Number(product.unitCost);
        const oldSalePrice = Number(product.salePrice);
        const newUnitCost = item.unitCost;
        
        let newSalePrice = oldSalePrice;

        // Auto-update sale price based on new unit cost
        if (newUnitCost > oldUnitCost) {
           if (product.profitPercentage) {
             const profit = Number(product.profitPercentage);
             newSalePrice = newUnitCost * (1 + (profit / 100));
             // If there is IVA, is salePrice with or without IVA? Usually salePrice is base price or final price. 
             // We will stick to the basic calculation: preserve the margin percentage.
           } else {
             // If no explicit profit percentage, preserve the multiplier
             const marginMultiplier = oldUnitCost > 0 ? (oldSalePrice / oldUnitCost) : 1;
             newSalePrice = newUnitCost * marginMultiplier;
           }
        } else if (newUnitCost < oldUnitCost) {
           // Optionally, also lower it, but usually clients want to keep it high unless manually changed.
           // Since client said "El sistema suba el precio automáticamente", we'll just recalculate it anyway to keep margin consistent.
           if (product.profitPercentage) {
             const profit = Number(product.profitPercentage);
             newSalePrice = newUnitCost * (1 + (profit / 100));
           } else {
             const marginMultiplier = oldUnitCost > 0 ? (oldSalePrice / oldUnitCost) : 1;
             newSalePrice = newUnitCost * marginMultiplier;
           }
        }

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
            unitCost: newUnitCost,
            salePrice: newSalePrice,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            adminId: data.adminId,
            type: "COMPRA",
            quantity: item.quantity,
            previousStock: previousStock,
            newStock: newStock,
            reason: `Compra - Factura ${data.invoiceNumber}`,
          },
        });
      }

      return invoice;
    });

    revalidatePath("/compras");
    revalidatePath("/inventario");

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("Error creating purchase invoice:", error);
    return {
      success: false,
      error: error.message || "Error interno al procesar la factura de compra.",
    };
  }
}

export async function getPurchaseInvoicesAction() {
  try {
    const invoices = await prisma.purchaseInvoice.findMany({
      include: {
        supplier: true,
        admin: {
          select: {
            name: true,
          }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return { success: true, data: invoices };
  } catch (error) {
    console.error("Error fetching purchase invoices:", error);
    return { success: false, error: "Error al obtener historial de compras" };
  }
}

export async function createQuickProductAction(data: { name: string; unitCost: number; salePrice: number; categoryId?: string }) {
  try {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: slug,
        unitCost: data.unitCost,
        salePrice: data.salePrice,
        categoryId: data.categoryId || null,
        stock: 0, // se sumará al guardar la factura
      }
    });
    return { success: true, data: product };
  } catch (error: any) {
    console.error("Error quick creating product:", error);
    return { success: false, error: "Error al crear el producto. Puede que el nombre (slug) ya exista." };
  }
}
