"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSuppliersAction() {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: suppliers,
    };
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return {
      success: false,
      error: "Error al obtener los proveedores.",
    };
  }
}

export async function getPaginatedSuppliersAction(searchQuery?: string, page: number = 1, pageSize: number = 10) {
  try {
    const whereClause: any = { isActive: true };
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { nit: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }
    const skip = (page - 1) * pageSize;
    const [totalCount, suppliers] = await prisma.$transaction([
      prisma.supplier.count({ where: whereClause }),
      prisma.supplier.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
      })
    ]);
    return { success: true, data: suppliers, totalPages: Math.ceil(totalCount / pageSize), totalCount };
  } catch (error) {
    console.error("Error fetching paginated suppliers:", error);
    return { success: false, error: "Error al obtener los proveedores." };
  }
}

export async function createSupplierAction(data: {
  nit: string;
  name: string;
  phone?: string;
  email?: string;
}) {
  try {
    const existingSupplier = await prisma.supplier.findUnique({
      where: {
        nit: data.nit,
      },
    });

    if (existingSupplier) {
      return {
        success: false,
        error: "Ya existe un proveedor con ese NIT.",
      };
    }

    const supplier = await prisma.supplier.create({
      data: {
        nit: data.nit,
        name: data.name,
        phone: data.phone,
        email: data.email,
      },
    });

    revalidatePath("/proveedores");
    revalidatePath("/compras/nueva");

    return {
      success: true,
      data: supplier,
    };
  } catch (error) {
    console.error("Error creating supplier:", error);
    return {
      success: false,
      error: "Error al crear el proveedor.",
    };
  }
}

export async function deleteSupplierAction(supplierId: string) {
  try {
    // Usamos una transacción para eliminar primero las facturas asociadas y luego el proveedor.
    // Los ítems de las facturas (PurchaseInvoiceItem) se eliminarán en cascada por la base de datos
    // ya que tienen `onDelete: Cascade` en el esquema.
    await prisma.$transaction([
      prisma.purchaseInvoice.deleteMany({
        where: {
          supplierId: supplierId
        }
      }),
      prisma.supplier.delete({
        where: {
          id: supplierId
        }
      })
    ]);

    revalidatePath("/proveedores");
    revalidatePath("/compras");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return {
      success: false,
      error: "Error al eliminar el proveedor. Asegúrate de que no tenga dependencias que impidan su eliminación.",
    };
  }
}
