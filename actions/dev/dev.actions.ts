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
