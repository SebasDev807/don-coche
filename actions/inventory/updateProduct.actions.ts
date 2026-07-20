'use server';

import { prisma } from '@/lib/prisma';
import { generateSlug } from '@/lib/utils/slug';
import { Prisma } from '@prisma/client';

/**
 * Propiedades de entrada para actualizar un producto existente.
 * Todos los campos son opcionales excepto el id.
 */
export interface UpdateProductInput {
  id: string;
  name?: string;
  brand?: string;
  categoryId?: string;
  stock?: number;
  unitCost?: number;
  salePrice?: number;
  profitPercentage?: number;
  isActive?: boolean;
}

/**
 * Interfaz de respuesta para el Server Action de actualizar producto.
 */
export interface UpdateProductResponse {
  success: boolean;
  message: string;
  product?: {
    id: string;
    code: string | null;
    name: string;
  };
}

/**
 * Server Action que actualiza los datos de un producto existente en el inventario.
 * Solo actualiza los campos que se proporcionen (partial update).
 *
 * @param {UpdateProductInput} data - Los datos a actualizar del producto.
 * @returns {Promise<UpdateProductResponse>} El resultado de la operación.
 */
export async function updateProduct(data: UpdateProductInput): Promise<UpdateProductResponse> {
  try {
    const { id, name, brand, categoryId, stock, unitCost, salePrice, profitPercentage, isActive } = data;

    if (!id) {
      return {
        success: false,
        message: 'El ID del producto es requerido.',
      };
    }

    // Verificar que el producto existe
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return {
        success: false,
        message: 'El producto no fue encontrado.',
      };
    }

    // Construir el objeto de actualización solo con los campos provistos
    const updateData: Prisma.ProductUpdateInput = {};

    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = generateSlug(`${name} ${brand ?? existing.brand ?? ''}`);
    }

    if (brand !== undefined) {
      updateData.brand = brand;
      // Recalcular slug si no se actualizó el nombre pero sí la marca
      if (name === undefined) {
        updateData.slug = generateSlug(`${existing.name} ${brand}`);
      }
    }

    if (categoryId !== undefined) {
      updateData.category_rel = { connect: { id: categoryId } };
    }

    if (stock !== undefined) {
      updateData.stock = stock;
    }

    if (unitCost !== undefined) {
      updateData.unitCost = new Prisma.Decimal(unitCost);
    }

    if (salePrice !== undefined) {
      updateData.salePrice = new Prisma.Decimal(salePrice);
    }

    if (profitPercentage !== undefined) {
      updateData.profitPercentage = new Prisma.Decimal(profitPercentage);
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: 'Producto actualizado exitosamente.',
      product: {
        id: updatedProduct.id,
        code: updatedProduct.code,
        name: updatedProduct.name,
      },
    };
  } catch (error) {
    console.error('[updateProduct] Error:', error);
    return {
      success: false,
      message: 'Ocurrió un error al intentar actualizar el producto.',
    };
  }
}
