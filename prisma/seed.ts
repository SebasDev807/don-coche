/**
 * @fileoverview Seed de la base de datos.
 *
 * Inserta usuarios iniciales con contraseñas hasheadas con bcrypt.
 * Incluye un usuario temporal de desarrollo (SUPERUSUARIO) con acceso total.
 *
 * Ejecutar con: `npx prisma db seed`
 */

import { PrismaClient, Role, ItemCategory, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { getSeedProducts } from '../lib/data/seed-inventory';

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
  email?: string;
  celular?: string;
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
  // Nuevos empleados añadidos
  {
    name: 'Juan David Ramírez',
    cc: '1002456789',
    email: 'juan.ramirez@serviteca.test',
    password: 'Admin2026!',
    celular: '3104567890',
    role: Role.ADMINISTRADOR,
  },
  {
    name: 'María Fernanda López',
    cc: '1003125478',
    email: 'maria.lopez@serviteca.test',
    password: 'Admin2026!',
    celular: '3116789452',
    role: Role.ADMINISTRADOR,
  },
  {
    name: 'Carlos Andrés Gómez',
    cc: '1098456721',
    email: 'carlos.gomez@serviteca.test',
    password: 'Tec2026#1',
    celular: '3125489631',
    role: Role.TECNICO,
  },
  {
    name: 'Sebastián Herrera',
    cc: '1087654321',
    email: 'sebastian.herrera@serviteca.test',
    password: 'Tec2026#2',
    celular: '3137894521',
    role: Role.TECNICO,
  },
  {
    name: 'Andrés Felipe Muñoz',
    cc: '1009988776',
    email: 'andres.munoz@serviteca.test',
    password: 'Tec2026#3',
    celular: '3149658742',
    role: Role.TECNICO,
  },
  {
    name: 'Luis Eduardo Castillo',
    cc: '1012345678',
    email: 'luis.castillo@serviteca.test',
    password: 'Tec2026#4',
    celular: '3158741236',
    role: Role.TECNICO,
  },
  {
    name: 'Natalia Rodríguez',
    cc: '1099876543',
    email: 'natalia.rodriguez@serviteca.test',
    password: 'Admin2026!',
    celular: '3164521987',
    role: Role.ADMINISTRADOR,
  },
  {
    name: 'Camilo Esteban Vargas',
    cc: '1004567891',
    email: 'camilo.vargas@serviteca.test',
    password: 'Tec2026#5',
    celular: '3173652148',
    role: Role.TECNICO,
  },
  {
    name: 'Diana Carolina Pérez',
    cc: '1011122233',
    email: 'diana.perez@serviteca.test',
    password: 'Tec2026#6',
    celular: '3187412365',
    role: Role.TECNICO,
  },
  {
    name: 'Felipe Santiago Torres',
    cc: '1091234567',
    email: 'felipe.torres@serviteca.test',
    password: 'Tec2026#7',
    celular: '3206549871',
    role: Role.TECNICO,
  },
];

/** Productos a insertar en la base de datos. */
const SEED_PRODUCTS = getSeedProducts();

async function main() {
  console.log('Iniciando el seed de la base de datos...\n');

  console.log('--- Sembrando Usuarios ---');
  for (const seedUser of SEED_USERS) {
    const passwordHash = await bcrypt.hash(seedUser.password, BCRYPT_ROUNDS);

    const user = await prisma.user.upsert({
      where: { cc: seedUser.cc },
      update: {
        name: seedUser.name,
        role: seedUser.role,
        email: seedUser.email || null,
        celular: seedUser.celular || null,
        passwordHash,
      },
      create: {
        cc: seedUser.cc,
        name: seedUser.name,
        role: seedUser.role,
        email: seedUser.email || null,
        celular: seedUser.celular || null,
        passwordHash,
        isActive: true,
      },
    });

    console.log(`  ✓ ${user.role.padEnd(14)} | ${user.cc} | ${user.name}`);
  }

  console.log('\n--- Sembrando Productos ---');
  for (const seedProduct of SEED_PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { code: seedProduct.code as string },
      update: {
        name: seedProduct.name,
        slug: seedProduct.slug,
        brand: seedProduct.brand,
        category: seedProduct.category,
        stock: seedProduct.stock,
        unitCost: seedProduct.unitCost,
        salePrice: seedProduct.salePrice,
        profitPercentage: seedProduct.profitPercentage,
        isActive: true,
      },
      create: {
        code: seedProduct.code,
        name: seedProduct.name,
        slug: seedProduct.slug,
        brand: seedProduct.brand,
        category: seedProduct.category,
        stock: seedProduct.stock,
        unitCost: seedProduct.unitCost,
        salePrice: seedProduct.salePrice,
        profitPercentage: seedProduct.profitPercentage,
        isActive: true,
      },
    });

    console.log(`  ✓ PRODUCTO       | ${product.code?.padEnd(14)} | ${product.name}`);
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

