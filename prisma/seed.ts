/**
 * @fileoverview Seed de la base de datos.
 *
 * Inserta usuarios iniciales con contraseñas hasheadas con bcrypt.
 * Incluye un usuario temporal de desarrollo (SUPERUSUARIO) con acceso total.
 *
 * Ejecutar con: `npx prisma db seed`
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

/**
 * Definición de un usuario para insertar en el seed.
 */
interface SeedUser {
  cc: string;
  name: string;
  role: Role;
  password: string;
}

/** Usuarios a insertar en la base de datos. */
const SEED_USERS: SeedUser[] = [
  {
    cc: '1002968695',
    name: 'Dev User',
    role: Role.SUPERUSUARIO,
    password: 'devmode12345!',
  },
  {
    cc: '1000000001',
    name: 'Lized Vaneza Trujillo Mona',
    role: Role.GERENTE,
    password: 'ingreso12345',
  },
  {
    cc: '2000000002',
    name: 'Carlos Administrador',
    role: Role.ADMINISTRADOR,
    password: 'ingreso12345',
  },
  {
    cc: '3000000003',
    name: 'Pedro Técnico',
    role: Role.TECNICO,
    password: 'ingreso12345',
  },
];

async function main() {
  console.log('Iniciando el seed de la base de datos...\n');

  for (const seedUser of SEED_USERS) {
    const passwordHash = await bcrypt.hash(seedUser.password, BCRYPT_ROUNDS);

    const user = await prisma.user.upsert({
      where: { cc: seedUser.cc },
      update: {
        name: seedUser.name,
        role: seedUser.role,
        passwordHash,
      },
      create: {
        cc: seedUser.cc,
        name: seedUser.name,
        role: seedUser.role,
        passwordHash,
        isActive: true,
      },
    });

    console.log(`  ✓ ${user.role.padEnd(14)} | ${user.cc} | ${user.name}`);
  }

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
