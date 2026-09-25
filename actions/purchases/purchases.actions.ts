"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type PurchaseItemInput = {
  productId: string;
  quantity: number;
  unitCost: number;
  subtotal: number; // Gross subtotal
  discountAmount?: number;
  netSubtotal: number;
};

export async function createPurchaseInvoiceAction(data: {
  supplierId: string;
  invoiceNumber: string;
  date: Date;
  subtotal: number;
  discountAmount?: number;
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
          discountAmount: data.discountAmount,
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
              discountAmount: item.discountAmount,
              netSubtotal: item.netSubtotal,
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
        const newUnitCost = item.unitCost;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
            unitCost: newUnitCost,
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
      data: {
        ...result,
        subtotal: Number(result.subtotal),
        ivaAmount: Number(result.ivaAmount),
        grandTotal: Number(result.grandTotal)
      },
    };
  } catch (error: any) {
    console.error("Error creating purchase invoice:", error);
    return {
      success: false,
      error: error.message || "Error interno al procesar la factura de compra.",
    };
  }
}

export async function getPurchaseInvoicesAction(searchQuery?: string, page: number = 1, pageSize: number = 6) {
  try {
    const whereClause: any = {};
    if (searchQuery) {
      whereClause.OR = [
        { invoiceNumber: { contains: searchQuery, mode: 'insensitive' } },
        { supplier: { name: { contains: searchQuery, mode: 'insensitive' } } }
      ];
    }

    const skip = (page - 1) * pageSize;

    const [totalCount, invoices] = await prisma.$transaction([
      prisma.purchaseInvoice.count({ where: whereClause }),
      prisma.purchaseInvoice.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        include: {
        supplier: true,
        admin: {
          select: {
            name: true,
          }
        },
        items: {
          include: {
            product: {
              select: { name: true, iva: true, salePrice: true, profitPercentage: true }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    ]);

    const serializedInvoices = invoices.map(inv => ({
      ...inv,
      subtotal: Number(inv.subtotal),
      ivaAmount: Number(inv.ivaAmount),
      grandTotal: Number(inv.grandTotal),
      items: inv.items.map(item => ({
        ...item,
        unitCost: Number(item.unitCost),
        subtotal: Number(item.subtotal),
        discountAmount: item.discountAmount ? Number(item.discountAmount) : 0,
        netSubtotal: item.netSubtotal ? Number(item.netSubtotal) : Number(item.subtotal),
        product: {
          ...item.product,
          iva: item.product.iva ? Number(item.product.iva) : 0,
          salePrice: Number(item.product.salePrice),
          profitPercentage: item.product.profitPercentage ? Number(item.product.profitPercentage) : 0,
        }
      }))
    }));

    const totalPages = Math.ceil(totalCount / pageSize);

    return { success: true, data: serializedInvoices, totalPages, totalCount };
  } catch (error) {
    console.error("Error fetching purchase invoices:", error);
    return { success: false, error: "Error al obtener historial de compras" };
  }
}

export async function getPurchaseInvoiceByIdAction(id: string) {
  try {
    const invoice = await prisma.purchaseInvoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              select: { name: true, iva: true, unitCost: true, salePrice: true, profitPercentage: true }
            }
          }
        },
      },
    });

    if (!invoice) return { success: false, error: "Factura no encontrada" };

    const serializedInvoice = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      ivaAmount: Number(invoice.ivaAmount),
      grandTotal: Number(invoice.grandTotal),
      items: invoice.items.map(item => ({
        ...item,
        unitCost: Number(item.unitCost),
        subtotal: Number(item.subtotal),
        discountAmount: item.discountAmount ? Number(item.discountAmount) : 0,
        netSubtotal: item.netSubtotal ? Number(item.netSubtotal) : Number(item.subtotal),
        product: {
          ...item.product,
          iva: item.product.iva ? Number(item.product.iva) : 0,
          unitCost: Number(item.product.unitCost),
          salePrice: Number(item.product.salePrice),
          profitPercentage: item.product.profitPercentage ? Number(item.product.profitPercentage) : 0,
        }
      }))
    };

    return { success: true, data: serializedInvoice };
  } catch (error) {
    console.error("Error fetching purchase invoice by id:", error);
    return { success: false, error: "Error al obtener factura de compra" };
  }
}

export async function createQuickProductAction(data: { name: string; unitCost: number; salePrice: number; categoryId?: string; profitPercentage?: number; iva?: number; barCode?: string; stock?: number }) {
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: slug,
        barCode: data.barCode || null,
        unitCost: data.unitCost,
        salePrice: data.salePrice,
        profitPercentage: data.profitPercentage,
        iva: data.iva,
        categoryId: data.categoryId || null,
        stock: data.stock || 0, // stock inicial opcional
      }
    });
    return {
      success: true,
      data: {
        ...product,
        unitCost: Number(product.unitCost),
        salePrice: Number(product.salePrice),
        profitPercentage: product.profitPercentage ? Number(product.profitPercentage) : null,
        iva: product.iva ? Number(product.iva) : null,
      }
    };
  } catch (error: any) {
    console.error("Error quick creating product:", error);
    // Si hay conflicto único (barcode o slug/nombre), buscar el producto existente para ofrecer actualización
    if (error.code === 'P2002') {
      // Intentar por barcode primero, luego por slug
      const existing = data.barCode
        ? await prisma.product.findUnique({ where: { barCode: data.barCode } })
        : null;
      const existingBySlug = existing ?? await prisma.product.findUnique({ where: { slug } });
      const found = existingBySlug;
      if (found) {
        const conflictField = data.barCode && found.barCode === data.barCode ? 'código de barras' : 'nombre';
        return {
          success: false,
          conflict: true,
          existingProduct: {
            ...found,
            unitCost: Number(found.unitCost),
            salePrice: Number(found.salePrice),
            profitPercentage: found.profitPercentage ? Number(found.profitPercentage) : null,
            iva: found.iva ? Number(found.iva) : null,
          },
          error: `El ${conflictField} ya pertenece al producto "${found.name}".`
        };
      }
    }
    return { success: false, error: "Error al crear el producto. Puede que el nombre o código de barras ya exista." };
  }

}


export async function createQuickSupplierAction(data: { name: string; nit: string; phone?: string; email?: string; }) {
  try {
    const existing = await prisma.supplier.findUnique({
      where: { nit: data.nit }
    });
    if (existing) {
      return { success: false, error: "Ya existe un proveedor con este NIT." };
    }
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        nit: data.nit,
        phone: data.phone || null,
        email: data.email || null,
      }
    });
    return { success: true, data: supplier };
  } catch (error: any) {
    console.error("Error creating quick supplier:", error);
    return { success: false, error: "Error interno al crear el proveedor." };
  }
}

export async function updatePurchaseInvoiceAction(invoiceId: string, data: {
  supplierId: string;
  invoiceNumber: string;
  date: Date;
  subtotal: number;
  discountAmount?: number;
  ivaAmount: number;
  grandTotal: number;
  adminId: string;
  notes?: string;
  items: PurchaseItemInput[];
}) {
  try {
    const existingInvoice = await prisma.purchaseInvoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!existingInvoice) {
      return { success: false, error: "La factura no existe." };
    }

    // Check for unique invoice number collision if supplier or number changed
    if (existingInvoice.invoiceNumber !== data.invoiceNumber || existingInvoice.supplierId !== data.supplierId) {
      const collision = await prisma.purchaseInvoice.findFirst({
        where: {
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber,
          id: { not: invoiceId }
        }
      });
      if (collision) {
        return { success: false, error: "Ya existe otra factura con ese número para este proveedor." };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.purchaseInvoiceItem.deleteMany({
        where: { invoiceId: invoiceId }
      });

      // Update invoice and insert new items
      const updatedInvoice = await tx.purchaseInvoice.update({
        where: { id: invoiceId },
        data: {
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber,
          date: data.date,
          subtotal: data.subtotal,
          discountAmount: data.discountAmount,
          ivaAmount: data.ivaAmount,
          grandTotal: data.grandTotal,
          notes: data.notes,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              subtotal: item.subtotal,
              discountAmount: item.discountAmount,
              netSubtotal: item.netSubtotal,
            })),
          },
        },
      });

      return updatedInvoice;
    });

    revalidatePath("/compras");
    revalidatePath("/inventario");
    revalidatePath(`/compras/editar/${invoiceId}`);

    return {
      success: true,
      data: {
        ...result,
        subtotal: Number(result.subtotal),
        ivaAmount: Number(result.ivaAmount),
        grandTotal: Number(result.grandTotal)
      },
    };
  } catch (error: any) {
    console.error("Error updating purchase invoice:", error);
    return {
      success: false,
      error: error.message || "Error interno al actualizar la factura de compra.",
    };
  }
}

export async function deletePurchaseInvoiceAction(invoiceId: string) {
  try {
    const existing = await prisma.purchaseInvoice.findUnique({ where: { id: invoiceId } });
    if (!existing) {
      return { success: false, error: "La factura no existe." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.purchaseInvoiceItem.deleteMany({
        where: { invoiceId }
      });
      await tx.purchaseInvoice.delete({
        where: { id: invoiceId }
      });
    });

    revalidatePath("/compras");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting purchase invoice:", error);
    return { success: false, error: "Error interno al eliminar la factura." };
  }
}

export async function updateQuickProductAction(id: string, data: { name: string; unitCost: number; salePrice: number; categoryId?: string; profitPercentage?: number; iva?: number; barCode?: string; stock?: number }) {
  try {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Check if product exists first
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'El producto no fue encontrado. Es posible que haya sido eliminado.' };
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: slug,
        barCode: data.barCode || null,
        unitCost: data.unitCost,
        salePrice: data.salePrice,
        profitPercentage: data.profitPercentage,
        iva: data.iva,
        categoryId: data.categoryId || null,
        stock: data.stock !== undefined ? data.stock : undefined,
      }
    });
    return {
      success: true,
      data: {
        ...product,
        unitCost: Number(product.unitCost),
        salePrice: Number(product.salePrice),
        profitPercentage: product.profitPercentage ? Number(product.profitPercentage) : null,
        iva: product.iva ? Number(product.iva) : null,
      }
    };
  } catch (error: any) {
    console.error('Error updating quick product:', error);
    if (error.code === 'P2025') {
      return { success: false, error: 'El producto no fue encontrado. Es posible que haya sido eliminado.' };
    }
    if (error.code === 'P2002') {
      return { success: false, error: 'El nombre o código de barras ya existe en otro producto.' };
    }
    return { success: false, error: 'No se pudo actualizar el producto.' };
  }
}
