'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyRole } from '@/lib/dal';

export async function verifyDevPassword(password: string): Promise<{ success: boolean; message: string }> {
  try {
    const session = await verifyRole(['SUPERUSUARIO']);
    
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    });
    
    if (!user) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: 'Contraseña incorrecta. Acceso denegado.' };
    }

    return { success: true, message: 'Acceso concedido.' };
  } catch (error) {
    console.error('[verifyDevPassword] Error:', error);
    return { success: false, message: 'Error interno de validación.' };
  }
}

/**
 * Función destructiva EXCLUSIVA para SUPERUSUARIOS en entorno de desarrollo.
 * Borra permanentemente el historial operativo de la base de datos (Órdenes, Ventas, Movimientos, Cuadres).
 * Requiere confirmación de contraseña.
 * 
 * @param password - Contraseña en texto plano del superusuario para validar la acción.
 * @returns Resultado de la operación.
 */
export async function wipeDevData(password: string): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Verificación estricta de sesión y rol
    const session = await verifyRole(['SUPERUSUARIO']);
    
    // 2. Extraer hash del usuario actual
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    });
    
    if (!user) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    // 3. Verificación de contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: 'Contraseña incorrecta. Operación denegada por seguridad.' };
    }

    // 4. Purga masiva en transacción para mantener integridad referencial
    await prisma.$transaction(async (tx) => {
      // a. Borrar dependencias de las órdenes
      await tx.orderService.deleteMany();
      await tx.orderProduct.deleteMany();
      await tx.whatsAppNotification.deleteMany();
      
      // b. Borrar dependencias de las ventas
      await tx.productSaleItem.deleteMany();
      
      // c. Borrar órdenes y ventas base
      await tx.order.deleteMany();
      await tx.productSale.deleteMany();
      
      // d. Borrar historial de inventario
      await tx.inventoryMovement.deleteMany();
      
      // e. Borrar consolidaciones (cierres de caja)
      await tx.cashClosure.deleteMany();
    }, {
      timeout: 20000, // Dar un poco más de tiempo por si hay muchos registros
    });

    return { success: true, message: 'El historial operativo ha sido destruido permanentemente.' };
  } catch (error) {
    console.error('[wipeDevData] Error crítico al intentar purgar los datos:', error);
    return { success: false, message: 'Error interno del servidor durante la purga de datos.' };
  }
}

/**
 * Función EXCLUSIVA para SUPERUSUARIOS en entorno de desarrollo.
 * Elimina permanentemente a los usuarios inactivos (isActive: false).
 * Requiere confirmación de contraseña.
 * 
 * @param password - Contraseña en texto plano del superusuario para validar la acción.
 * @returns Resultado de la operación.
 */
export async function deleteInactiveUsers(password: string): Promise<{ success: boolean; message: string }> {
  try {
    const session = await verifyRole(['SUPERUSUARIO']);
    
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    });
    
    if (!user) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: 'Contraseña incorrecta. Operación denegada por seguridad.' };
    }

    const inactiveUsers = await prisma.user.findMany({
      where: { isActive: false },
      select: { id: true }
    });

    if (inactiveUsers.length === 0) {
      return { success: true, message: 'No hay usuarios inactivos para eliminar.' };
    }

    const inactiveUserIds = inactiveUsers.map(u => u.id);

    await prisma.$transaction(async (tx) => {
      // Eliminar registros de asistencia que no afectan contabilidad
      await tx.attendanceRecord.deleteMany({
        where: { userId: { in: inactiveUserIds } }
      });

      // Eliminar los usuarios
      await tx.user.deleteMany({
        where: { id: { in: inactiveUserIds } }
      });
    });

    return { success: true, message: `Se han eliminado permanentemente ${inactiveUsers.length} usuarios inactivos.` };
  } catch (error) {
    console.error('[deleteInactiveUsers] Error:', error);
    return { success: false, message: 'Error al eliminar. Es posible que los usuarios tengan registros operativos (debes purgar la BD primero).' };
  }
}

export async function getDevCustomers(password: string) {
  try {
    const session = await verifyRole(['SUPERUSUARIO']);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    });
    
    if (!user) return { success: false, message: 'Usuario no encontrado.', data: [] };
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return { success: false, message: 'Contraseña incorrecta.', data: [] };

    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: { vehicles: true, appointments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, message: 'Clientes obtenidos.', data: customers };
  } catch (error) {
    console.error('[getDevCustomers] Error:', error);
    return { success: false, message: 'Error al obtener clientes.', data: [] };
  }
}

export async function deleteCustomerCascade(password: string, customerId: string): Promise<{ success: boolean; message: string }> {
  try {
    const session = await verifyRole(['SUPERUSUARIO']);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    });
    
    if (!user) return { success: false, message: 'Usuario no encontrado.' };
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return { success: false, message: 'Contraseña incorrecta.' };

    await prisma.$transaction(async (tx) => {
      // 1. Encontrar vehículos del cliente
      const vehicles = await tx.vehicle.findMany({ where: { customerId } });
      const vehicleIds = vehicles.map(v => v.id);

      if (vehicleIds.length > 0) {
        // 2. Encontrar órdenes de esos vehículos
        const orders = await tx.order.findMany({ where: { vehicleId: { in: vehicleIds } } });
        const orderIds = orders.map(o => o.id);

        if (orderIds.length > 0) {
          // 3. Eliminar dependencias de las órdenes
          await tx.whatsAppNotification.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.orderService.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.orderProduct.deleteMany({ where: { orderId: { in: orderIds } } });
          
          // 4. Eliminar las órdenes
          await tx.order.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
        }
      }

      await tx.appointment.deleteMany({ where: { customerId } });
      await tx.vehicle.deleteMany({ where: { customerId } });
      await tx.customer.delete({ where: { id: customerId } });
    });

    return { success: true, message: 'Cliente y todas sus dependencias (vehículos, citas y órdenes) eliminados correctamente.' };
  } catch (error) {
    console.error('[deleteCustomerCascade] Error:', error);
    return { success: false, message: 'Error al eliminar cliente. Verifica los logs del servidor.' };
  }
}

export async function deleteAllCustomersCascade(password: string): Promise<{ success: boolean; message: string }> {
  try {
    const session = await verifyRole(['SUPERUSUARIO']);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    });
    
    if (!user) return { success: false, message: 'Usuario no encontrado.' };
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return { success: false, message: 'Contraseña incorrecta.' };

    await prisma.$transaction(async (tx) => {
      // Eliminar todas las dependencias de órdenes en general para poder borrar los vehículos
      await tx.whatsAppNotification.deleteMany();
      await tx.orderService.deleteMany();
      await tx.orderProduct.deleteMany();
      await tx.order.deleteMany();

      await tx.appointment.deleteMany();
      await tx.vehicle.deleteMany();
      await tx.customer.deleteMany();
    });

    return { success: true, message: 'Todos los clientes y su historial operativo han sido eliminados.' };
  } catch (error) {
    console.error('[deleteAllCustomersCascade] Error:', error);
    return { success: false, message: 'Error al eliminar clientes masivamente. Verifica los logs.' };
  }
}

const MOCK_NAMES = ['Juan', 'Maria', 'Carlos', 'Ana', 'Luis', 'Pedro', 'Sofia', 'Laura', 'Diego', 'Lucia'];
const MOCK_LASTNAMES = ['Perez', 'Gomez', 'Lopez', 'Garcia', 'Martinez', 'Rodriguez', 'Fernandez', 'Hernandez', 'Diaz', 'Torres'];
const CAR_BRANDS = ['Toyota', 'Chevrolet', 'Nissan', 'Renault', 'Mazda', 'Kia', 'Ford'];

export async function seedMockCustomers(password: string, count: number = 10): Promise<{ success: boolean; message: string }> {
  try {
    const session = await verifyRole(['SUPERUSUARIO']);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    });
    
    if (!user) return { success: false, message: 'Usuario no encontrado.' };
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return { success: false, message: 'Contraseña incorrecta.' };

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < count; i++) {
        const name = `${MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)]} ${MOCK_LASTNAMES[Math.floor(Math.random() * MOCK_LASTNAMES.length)]}`;
        const cc = `MOCK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        const customer = await tx.customer.create({
          data: {
            name,
            cc,
            phone: `300${Math.floor(1000000 + Math.random() * 9000000)}`,
            email: `mock${i}_${Date.now()}@example.com`,
          }
        });

        // Generar 1 o 2 vehículos
        const numVehicles = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < numVehicles; j++) {
          const plate = `MCK${Math.floor(Math.random() * 1000)}${j}`;
          await tx.vehicle.create({
            data: {
              plate,
              brand: CAR_BRANDS[Math.floor(Math.random() * CAR_BRANDS.length)],
              model: `20${Math.floor(10 + Math.random() * 14)}`,
              color: 'Blanco',
              customerId: customer.id
            }
          });
        }
      }
    });

    return { success: true, message: `Se han generado ${count} clientes mock con sus vehículos de forma exitosa.` };
  } catch (error) {
    console.error('[seedMockCustomers] Error:', error);
    return { success: false, message: 'Error al generar clientes mock. Es posible que hubo una colisión de placas o cédulas.' };
  }
}

const MOCK_PRODUCT_NAMES = ['Filtro de Aceite', 'Bujía', 'Pastillas de Freno', 'Amortiguador', 'Batería', 'Aceite Sintético', 'Llanta', 'Correa de Distribución', 'Radiador', 'Filtro de Aire'];

export async function seedMockProducts(password: string, count: number = 10): Promise<{ success: boolean; message: string }> {
  try {
    const session = await verifyRole(['SUPERUSUARIO']);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    });
    
    if (!user) return { success: false, message: 'Usuario no encontrado.' };
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return { success: false, message: 'Contraseña incorrecta.' };

    await prisma.$transaction(async (tx) => {
      const existingCategories = await tx.category.findMany();
      const catIds = existingCategories.map(c => c.id);

      for (let i = 0; i < count; i++) {
        const baseName = MOCK_PRODUCT_NAMES[Math.floor(Math.random() * MOCK_PRODUCT_NAMES.length)];
        const name = `MOCK ${baseName} ${Math.floor(Math.random() * 1000)}`;
        const slug = `mock-${baseName.toLowerCase().replace(/ /g, '-')}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const barCode = `MCK-PRD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const unitCost = Math.floor(10000 + Math.random() * 90000); // 10k to 100k
        const profitPercentage = 30 + Math.floor(Math.random() * 20); // 30% to 50%
        const salePrice = (unitCost / (1 - (profitPercentage / 100))) * 1.19; // Price with IVA

        await tx.product.create({
          data: {
            name,
            slug,
            barCode,
            stock: Math.floor(1 + Math.random() * 50),
            unitCost,
            salePrice,
            profitPercentage,
            iva: 19,
            categoryId: catIds.length > 0 ? catIds[Math.floor(Math.random() * catIds.length)] : undefined
          }
        });
      }
    });

    return { success: true, message: `Se han generado ${count} productos mock exitosamente.` };
  } catch (error) {
    console.error('[seedMockProducts] Error:', error);
    return { success: false, message: 'Error al generar productos mock.' };
  }
}

export async function deleteMockProducts(password: string): Promise<{ success: boolean; message: string }> {
  try {
    const session = await verifyRole(['SUPERUSUARIO']);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    });
    
    if (!user) return { success: false, message: 'Usuario no encontrado.' };
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return { success: false, message: 'Contraseña incorrecta.' };

    await prisma.$transaction(async (tx) => {
      // Borrar productos cuyo nombre empiece con "MOCK"
      const mockProducts = await tx.product.findMany({
        where: { name: { startsWith: 'MOCK' } }
      });
      const productIds = mockProducts.map(p => p.id);

      if (productIds.length > 0) {
        await tx.product.deleteMany({
          where: { id: { in: productIds } }
        });
      }
    });

    return { success: true, message: 'Productos mock eliminados correctamente.' };
  } catch (error) {
    console.error('[deleteMockProducts] Error:', error);
    return { success: false, message: 'Error al eliminar productos mock. Si tienen ventas operativas, purga la base de datos.' };
  }
}
