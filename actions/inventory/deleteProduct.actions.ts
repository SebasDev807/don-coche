'use server';

import { prisma } from '@/lib/prisma';

/**
 * Interfaz de respuesta para el Server Action de eliminar producto.
 */
export interface DeleteProductResponse {
  success: boolean;
  message: string;
}

/**
 * Server Action que elimina (soft delete) un producto del inventario
 * marcándolo como inactivo en lugar de borrarlo físicamente.
 *
 * @param {string} id - El ID del producto a eliminar.
 * @returns {Promise<DeleteProductResponse>} El resultado de la operación.
 */
export async function deleteProduct(id: string): Promise<DeleteProductResponse> {
  try {
    if (!id) {
      return {
        success: false,
        message: 'El ID del producto es requerido.',
      };
    }

    // Verificar que el producto existe y está activo
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return {
        success: false,
        message: 'El producto no fue encontrado.',
      };
    }

    if (!existing.isActive) {
      return {
        success: false,
        message: 'El producto ya se encuentra inactivo.',
      };
    }

    // Soft delete: marcar como inactivo en lugar de borrar el registro
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Producto eliminado exitosamente.',
    };
  } catch (error) {
    console.error('[deleteProduct] Error:', error);
    return {
      success: false,
      message: 'Ocurrió un error al intentar eliminar el producto.',
    };
  }
}
