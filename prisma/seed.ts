import { PrismaClient, Role } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Iniciando el seed de la base de datos...')

  // 1. GERENTE
  const gerente = await prisma.user.upsert({
    where: { cc: '1000000001' },
    update: {},
    create: {
      cc: '1000000001',
      name: 'Lized Vaneza Trujillo Mona',
      role: Role.GERENTE,
      passwordHash: 'dummy_hash_123', // En producción se debe encriptar (ej. bcrypt)
      isActive: true,
    },
  })

  // 2. ADMINISTRADOR
  const admin = await prisma.user.upsert({
    where: { cc: '2000000002' },
    update: {},
    create: {
      cc: '2000000002',
      name: 'Carlos Administrador',
      role: Role.ADMINISTRADOR,
      passwordHash: 'dummy_hash_123',
      isActive: true,
    },
  })

  // 3. TÉCNICO
  const tecnico = await prisma.user.upsert({
    where: { cc: '3000000003' },
    update: {},
    create: {
      cc: '3000000003',
      name: 'Pedro Técnico',
      role: Role.TECNICO,
      passwordHash: 'dummy_hash_123',
      isActive: true,
    },
  })

  console.log('Seed exitoso. Usuarios creados:')
  console.log({ gerente, admin, tecnico })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
