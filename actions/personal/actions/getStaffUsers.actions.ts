'use server';

import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

/**
 * Obtiene todos los usuarios (personal) de la base de datos,
 * ordenados por jerarquía de rol (Gerente, Administrador, Técnico) y
 * secundariamente alfabéticamente por nombre.
 *
 * @returns {Promise<User[]>} Promesa que resuelve en un arreglo de usuarios.
 */
export async function getStaffUsers(query?: string, role?: string): Promise<User[]> {
  try {
    const whereClause: any = {};

    if (role && role !== 'SUPERUSUARIO') {
      whereClause.role = role;
    } else {
      whereClause.role = {
        not: 'SUPERUSUARIO',
      };
    }

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

    const getRolePriority = (uRole: string): number => {
      switch (uRole) {
        case 'GERENTE':
          return 1;
        case 'ADMINISTRADOR':
          return 2;
        case 'TECNICO':
          return 3;
        default:
          return 4;
      }
    };

    return users.sort((a, b) => {
      // Prioridad 1: Activos primero
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;

      // Prioridad 2: Jerarquía de rol
      const priorityA = getRolePriority(a.role);
      const priorityB = getRolePriority(b.role);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Prioridad 3: Orden alfabético
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error fetching staff users:', error);
    return [];
  }
}
