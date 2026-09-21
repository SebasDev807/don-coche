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
