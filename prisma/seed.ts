/**
 * @fileoverview Seed de la base de datos.
 *
 * Crea únicamente el usuario SUPERUSUARIO de producción.
 *
 * Ejecutar con: `pnpm db:seed`
 */

import { PrismaClient, Role } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/** Número de rondas de sal para bcrypt. */
const BCRYPT_ROUNDS = 10;

async function main() {
  console.log('Iniciando el seed de la base de datos...\n');

  const passwordHash = await bcrypt.hash('devmode12345!', BCRYPT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { cc: '1002968695' },
    update: {
      name: 'Dev User',
      role: Role.SUPERUSUARIO,
      email: 'dev@doncoche.test',
      celular: '3001112233',
      passwordHash,
      isActive: true,
    },
    create: {
      cc: '1002968695',
      name: 'Dev User',
      role: Role.SUPERUSUARIO,
      email: 'dev@doncoche.test',
      celular: '3001112233',
      passwordHash,
      isActive: true,
    },
  });

  console.log(`  ✓ ${user.role.padEnd(14)} | CC: ${user.cc} | ${user.name}`);
  console.log('\nSeed exitoso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
