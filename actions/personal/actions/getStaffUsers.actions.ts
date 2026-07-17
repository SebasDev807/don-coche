'use server';

import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

/**
 * Obtiene todos los usuarios (personal) de la base de datos,
 * ordenados alfabéticamente por nombre.
 *
 * @returns {Promise<User[]>} Promesa que resuelve en un arreglo de usuarios.
 */
export async function getStaffUsers(query?: string): Promise<User[]> {
  try {
    const whereClause: any = {
      role: {
        not: 'SUPERUSUARIO',
      },
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { cc: { contains: query } },
        { email: { contains: query, mode: 'insensitive' } },
        { celular: { contains: query } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
    return users;
  } catch (error) {
    console.error('Error fetching staff users:', error);
    return [];
  }
}
