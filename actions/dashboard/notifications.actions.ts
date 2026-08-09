'use server';

import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/dal';

export type AppNotificationType = 'stock_low' | 'stock_out' | 'user' | 'car' | 'system' | 'appointment_rescheduled';

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  link?: string;
}

/**
 * Obtiene las notificaciones del sistema.
 * Por ahora solo obtiene notificaciones de productos con stock bajo (<= 10).
 */
export async function getNotificationsAction(): Promise<AppNotification[]> {
  // Solo superusuarios, gerentes o administradores
  await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

  const notifications: AppNotification[] = [];

  // Obtener productos con stock bajo
  const lowStockProducts = await prisma.product.findMany({
    where: {
      stock: {
        lte: 10,
      },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      stock: true,
    },
    orderBy: {
      stock: 'asc',
    },
  });

  for (const product of lowStockProducts) {
    const isOutOfStock = product.stock === 0;
    notifications.push({
      id: `stock-${product.id}`,
      type: isOutOfStock ? 'stock_out' : 'stock_low',
      title: isOutOfStock ? 'Producto Agotado' : 'Stock Bajo',
      message: isOutOfStock
        ? `El producto ${product.name} está agotado (0 unidades).`
        : `El producto ${product.name} tiene solo ${product.stock} unidades disponibles.`,
      createdAt: new Date(),
      isRead: false,
      link: `/inventario/${product.id}`,
    });
  }

  // Obtener notificaciones persistentes de la base de datos (no leídas)
  const dbNotifications = await prisma.appNotification.findMany({
    where: {
      isRead: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20, // Límite razonable
  });

  // Mapear al formato de la interfaz
  const persistentNotifications = dbNotifications.map((notif) => ({
    id: notif.id,
    type: notif.type as AppNotificationType,
    title: notif.title,
    message: notif.message,
    createdAt: notif.createdAt,
    isRead: notif.isRead,
    link: notif.link || undefined,
  }));

  // Combinar y ordenar por fecha (más recientes primero)
  const allNotifications = [...notifications, ...persistentNotifications].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return allNotifications;
}

/**
 * Marca una notificación de la base de datos como leída.
 * 
 * @param id El ID de la notificación
 */
export async function markNotificationAsReadAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);
    
    // Ignorar si es una notificación generada dinámicamente (stock)
    if (id.startsWith('stock-')) {
      return { success: true };
    }

    await prisma.appNotification.update({
      where: { id },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'No se pudo marcar como leída' };
  }
}
