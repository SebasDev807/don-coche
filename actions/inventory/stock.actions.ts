'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

export interface BatchStockUpdateItem {
  id: string;
  quantityToAdd: number;
}

/**
 * Server action para actualizar el stock de múltiples productos a la vez.
 * Utiliza una transacción para garantizar la integridad de la base de datos.
 */
export async function batchUpdateStock(items: BatchStockUpdateItem[]) {
  try {
    await verifySession();

    if (!items || items.length === 0) {
      return { success: false, message: 'No hay productos para actualizar.' };
    }

    // Filtramos aquellos que tengan cantidad 0 para no hacer updates innecesarios
    const itemsToUpdate = items.filter(item => item.quantityToAdd > 0);
    
    if (itemsToUpdate.length === 0) {
       return { success: true, message: 'Ningún producto modificado.' };
    }

    await prisma.$transaction(
      itemsToUpdate.map((item) =>
        prisma.product.update({
          where: { id: item.id },
          data: {
            stock: {
              increment: item.quantityToAdd,
            },
          },
        })
      )
    );

    return { success: true, message: `Se actualizó el stock de ${itemsToUpdate.length} productos correctamente.` };
  } catch (error: any) {
    console.error('[batchUpdateStock] Error:', error);
    return { success: false, message: error.message || 'Ocurrió un error al intentar actualizar el stock en lote.' };
  }
}
