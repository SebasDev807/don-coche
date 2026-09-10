'use server';

import { prisma } from '@/lib/prisma';
import { createServiceSchema } from '@/validation';
import { verifySession } from '@/lib/dal';
import { revalidatePath } from 'next/cache';

/**
 * Server action para crear un nuevo servicio en el catálogo.
 * 
 * @param {FormData} formData - Los datos del formulario
 * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación
 */
export async function createService(formData: FormData) {
  try {
    await verifySession();

    const rawData = Object.fromEntries(formData.entries());
    const validatedData = createServiceSchema.parse(rawData);

    await prisma.serviceCatalog.create({
      data: {
        name: validatedData.name,
        categoryId: validatedData.categoryId || null,
        category: validatedData.category || null,
        basePrice: validatedData.basePrice,
        description: validatedData.description || null,
        isActive: true,
      },
    });

    // Optionally revalidate the path where services are listed
    revalidatePath('/dashboard/catalog');

    return { success: true, message: 'Servicio creado exitosamente' };
  } catch (error: any) {
    console.error('Error creating service:', error);
    return { success: false, message: error.message || 'Error al crear el servicio' };
  }
}
