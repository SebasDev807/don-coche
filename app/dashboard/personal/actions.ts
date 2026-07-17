'use server';

import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

/**
 * Obtiene todos los usuarios (personal) de la base de datos
 * ordenados alfabéticamente por nombre.
 */
export async function getStaffUsers(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    });
    return users;
  } catch (error) {
    console.error('Error fetching staff users:', error);
    return [];
  }
}
