/**
 * @fileoverview Script de limpieza total de la base de datos.
 *
 * Elimina TODOS los registros de todas las tablas en el orden correcto
 * para respetar las restricciones de foreign key.
 *
 * ⚠️  DESTRUCTIVO - Solo usar en entornos de desarrollo/reset.
 *
 * Ejecutar con: `npx tsx prisma/reset-db.ts`
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('⚠️  Iniciando limpieza total de la base de datos...\n');

  // Orden: primero las tablas hoja (sin dependientes), luego las raíz
  await prisma.whatsAppNotification.deleteMany();
  console.log('  ✓ whatsapp_notifications');

  await prisma.orderService.deleteMany();
  console.log('  ✓ order_services');

  await prisma.orderProduct.deleteMany();
  console.log('  ✓ order_products');

  await prisma.inventoryMovement.deleteMany();
  console.log('  ✓ inventory_movements');

  await prisma.order.deleteMany();
  console.log('  ✓ orders');

  await prisma.cashClosure.deleteMany();
  console.log('  ✓ cash_closures');

  await prisma.appointment.deleteMany();
  console.log('  ✓ appointments');

  await prisma.attendanceRecord.deleteMany();
  console.log('  ✓ attendance_records');

  await prisma.appNotification.deleteMany();
  console.log('  ✓ app_notifications');

  await prisma.serviceCatalog.deleteMany();
  console.log('  ✓ service_catalog');

  await prisma.product.deleteMany();
  console.log('  ✓ products');

  await prisma.category.deleteMany();
  console.log('  ✓ categories');

  await prisma.vehicle.deleteMany();
  console.log('  ✓ vehicles');

  await prisma.customer.deleteMany();
  console.log('  ✓ customers');

  // Eliminar todos los usuarios EXCEPTO el Superusuario CC:1002968695
  await prisma.user.deleteMany({
    where: {
      cc: { not: '1002968695' },
    },
  });
  console.log('  ✓ users (excepto SUPERUSUARIO CC:1002968695)');

  console.log('\n✅ Base de datos limpiada exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la limpieza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
