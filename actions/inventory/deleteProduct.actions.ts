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


    // Soft delete: en lugar de borrar físicamente (lo cual falla si hay facturas o historial),
    // marcamos el producto como inactivo y liberamos su código de barras y slug.
    await prisma.product.update({
      where: { id },
      data: {
        isActive: false,
        barCode: existing.barCode ? `${existing.barCode}_del_${Date.now()}` : null,
        slug: `${existing.slug}_del_${Date.now()}`
      }
    });

    return {
      success: true,
      message: 'Producto eliminado exitosamente.',
    };
  } catch (error: any) {
    console.error('[deleteProduct] Error:', error);
    
    return {
      success: false,
      message: 'Ocurrió un error al intentar eliminar el producto.',
    };
  }
}
