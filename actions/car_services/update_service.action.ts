'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { revalidatePath } from 'next/cache';

export async function updateService(id: string, data: { name: string; basePrice: number; category?: string; description?: string; profitPercentage?: number; autoRound?: boolean }) {
  try {
    await verifySession();

    // Redondear a múltiplo de 50 si autoRound es true (por defecto true)
    const shouldRound = data.autoRound !== undefined ? data.autoRound : true;
    const roundedPrice = shouldRound 
      ? Math.round(data.basePrice / 50) * 50 
      : data.basePrice;

    await prisma.serviceCatalog.update({
      where: { id },
      data: {
        name: data.name,
        basePrice: roundedPrice,
        category: data.category as any, // Cast to ItemCategory enum
        profitPercentage: data.profitPercentage ?? null,
        description: data.description,
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
