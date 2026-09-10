/**
 * @fileoverview Singleton de PrismaClient para la aplicación.
 *
 * Utiliza el adaptador `@prisma/adapter-pg` con un pool de conexiones `pg`
 * para conectar a PostgreSQL. En desarrollo, reutiliza la instancia global
 * para evitar agotar conexiones durante hot-reload de Next.js.
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Crea una nueva instancia de PrismaClient con el adaptador pg.
 *
 * @returns Instancia configurada de PrismaClient.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/** Extensión del objeto global de Node para almacenar la instancia en desarrollo. */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Instancia singleton de PrismaClient.
 *
 * En producción se crea una nueva instancia.
 * En desarrollo se reutiliza la instancia global para evitar
 * múltiples pools de conexiones con hot-reload.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
