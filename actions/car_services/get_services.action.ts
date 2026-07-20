'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

export async function getServices({ page = 1, limit = 8, category, query }: { page?: number; limit?: number; category?: string; query?: string } = {}) {
  try {
    await verifySession();

    const skip = (page - 1) * limit;
    
    const whereClause: any = { isActive: true };
    if (category) {
      whereClause.category = category.toUpperCase() as any;
    }
    if (query) {
      whereClause.name = { contains: query, mode: 'insensitive' };
    }

    const [services, total] = await Promise.all([
      prisma.serviceCatalog.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceCatalog.count({ where: whereClause }),
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
