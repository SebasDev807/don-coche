'use server';

import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/dal';

export type AppNotificationType = 'stock_low' | 'stock_out' | 'user' | 'car' | 'system';

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
      createdAt: new Date(), // Simulado por ahora, en BD vendría el real si existiera tabla de notificaciones
      isRead: false,
      link: `/inventario/${product.id}`,
    });
  }

  return notifications;
}
