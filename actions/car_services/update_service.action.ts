'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { revalidatePath } from 'next/cache';

export async function updateService(id: string, data: { name: string; basePrice: number; category?: string; icon?: string }) {
  try {
    await verifySession();

    await prisma.serviceCatalog.update({
      where: { id },
      data: {
        name: data.name,
        basePrice: data.basePrice,
        category: data.category as any, // Cast to ItemCategory enum
        icon: data.icon,
      },
    });

    revalidatePath('/dashboard/catalog');
    revalidatePath('/servicios');
    
    return { success: true, message: 'Servicio actualizado exitosamente' };
  } catch (error: any) {
    console.error('Error updating service:', error);
    return { success: false, message: error.message || 'Error al actualizar el servicio' };
  }
}

export async function deleteService(id: string) {
  try {
    await verifySession();

    // Instead of hard delete, we could soft delete, but for now we delete or soft delete based on the model
    // The model has isActive field
    await prisma.serviceCatalog.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath('/dashboard/catalog');
    revalidatePath('/servicios');

    return { success: true, message: 'Servicio eliminado exitosamente' };
  } catch (error: any) {
    console.error('Error deleting service:', error);
    return { success: false, message: error.message || 'Error al eliminar el servicio' };
  }
}
