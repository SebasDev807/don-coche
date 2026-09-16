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
 * Server Action que elimina (hard delete) un producto físicamente del inventario.
 *
 * @param {string} id - El ID del producto a eliminar.
 * @returns {Promise<DeleteProductResponse>} El resultado de la operación.
 */
export async function deleteProduct(id: string): Promise<DeleteProductResponse> {
  // Solo SuperUsuario, Gerente y Administrador pueden eliminar productos
  const { verifyRole } = await import('@/lib/dal');
  await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

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


    // Hard delete: borrar físicamente de la base de datos
    await prisma.product.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Producto eliminado físicamente exitosamente.',
    };
  } catch (error: any) {
    console.error('[deleteProduct] Error:', error);
    
    // P2003 es el código de Prisma para violaciones de llaves foráneas
    if (error.code === 'P2003') {
      return {
        success: false,
        message: 'No se puede eliminar el producto porque tiene historial operativo (ventas, movimientos u órdenes asociadas). Si ya no se usa, considere modificarlo o dejar su stock en 0.',
      };
    }

    return {
      success: false,
      message: 'Ocurrió un error al intentar eliminar el producto físicamente.',
    };
  }
}
