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
  description?: string;
  categoryId?: string;
  barCode?: string;
  stock?: number;
  unitCost?: number;
  salePrice?: number;
  profitPercentage?: number;
  iva?: number;
  autoRound?: boolean;
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
    barCode: string | null;
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
import { verifyRole } from '@/lib/dal';

export async function updateProduct(data: UpdateProductInput): Promise<UpdateProductResponse> {
  try {
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'AUXILIAR_ADMINISTRATIVO']);
    const { id, name, description, categoryId, barCode, stock, unitCost, salePrice, profitPercentage, iva, autoRound, isActive } = data;

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
      updateData.slug = generateSlug(name);
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (barCode !== undefined) {
      updateData.barCode = barCode;
    }

    if (categoryId !== undefined) {
      if (!categoryId || categoryId === "") {
        updateData.category_rel = { disconnect: true };
      } else {
        updateData.category_rel = { connect: { id: categoryId } };
      }
    }

    if (stock !== undefined) {
      updateData.stock = stock;
    }

    //Fix to allow null values and correct decimal conversion
    if (unitCost !== undefined) {
      updateData.unitCost = new Prisma.Decimal(unitCost);
    }

    if (profitPercentage !== undefined) {
      updateData.profitPercentage = profitPercentage === null
        ? null
        : new Prisma.Decimal(profitPercentage);
    }

    if (iva !== undefined) {
      updateData.iva = iva === null ? null : new Prisma.Decimal(iva);
    }

    // Compute salePrice if unitCost, profitPercentage, or iva changed
    if (unitCost !== undefined || profitPercentage !== undefined || iva !== undefined || autoRound !== undefined) {
      const finalUnitCost = unitCost !== undefined ? unitCost : Number(existing.unitCost);
      const finalProfitPercentage = profitPercentage !== undefined ? profitPercentage : (existing.profitPercentage ? Number(existing.profitPercentage) : 0);
      const finalIva = iva !== undefined ? (iva === null ? 0 : Number(iva)) : (existing.iva ? Number(existing.iva) : 0);
      
      // Costo con IVA
      const costWithIva = finalUnitCost * (1 + (finalIva / 100));
      
      // Cálculo del precio de venta usando Markup (Costo con IVA * (1 + Margen))
      let computedSalePrice = costWithIva * (1 + (finalProfitPercentage / 100));

      // Use provided autoRound or default to true for existing logic
      const shouldRound = autoRound !== undefined ? autoRound : true;
      if (shouldRound) {
        computedSalePrice = Math.round(computedSalePrice / 50) * 50;
      }

      updateData.salePrice = new Prisma.Decimal(computedSalePrice);
    } else if (salePrice !== undefined) {
      updateData.salePrice = new Prisma.Decimal(salePrice);
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
        barCode: updatedProduct.barCode,
        name: updatedProduct.name,
      },
    };
  } catch (error) {
    console.error('[updateProduct] Error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return {
          success: false,
          message: 'Ya existe otro producto con este código de barras. Usa uno distinto.',
        };
      }
    }

    return {
      success: false,
      message: 'Ocurrió un error al intentar actualizar el producto.',
    };
  }
}
