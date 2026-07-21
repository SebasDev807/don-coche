'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

export async function searchProductsAction(query: string) {
  try {
    await verifySession();

    if (!query || query.trim().length === 0) {
      return { success: true, data: [] };
    }

    const searchTerm = query.trim();

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            code: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: 10,
      select: {
        id: true,
        name: true,
        code: true,
        unitCost: true,
        salePrice: true,
        stock: true,
      },
    });

    const serializedProducts = products.map((p) => ({
      ...p,
      unitCost: p.unitCost.toNumber(),
      salePrice: p.salePrice.toNumber(),
    }));

    return { success: true, data: serializedProducts };
  } catch (error: any) {
    console.error('Error searching products:', error);
    return { success: false, message: 'Error al buscar productos', data: [] };
  }
}
