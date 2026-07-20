'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

export async function getServices({ page = 1, limit = 8 }: { page?: number; limit?: number } = {}) {
  try {
    await verifySession();

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      prisma.serviceCatalog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceCatalog.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: services.map(service => ({
        ...service,
        basePrice: Number(service.basePrice),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return {
      success: false,
      message: error.message || 'Error al obtener los servicios',
      data: [],
      pagination: { page: 1, limit: 8, total: 0, totalPages: 0 },
    };
  }
}
