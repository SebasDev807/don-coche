'use server';

import { prisma } from '@/lib/prisma';
import { createProductSchema } from '@/validation';
import { generateSKU } from '@/lib/utils/sku';
import { generateSlug } from '@/lib/utils/slug';
import { verifySession } from '@/lib/dal';
import { ItemCategory } from '@prisma/client';

/**
 * Server action para obtener las categorías existentes.
 * 
 * @returns {Promise<{id: string, name: string}[]>} Lista de categorías
 */
export async function getCategories() {
  try {
    // Retornamos las categorías basadas en el enum ItemCategory que se usa en el schema de Product
    return [
      { id: ItemCategory.LAVADERO, name: 'Lavadero' },
      { id: ItemCategory.SERVITECA, name: 'Serviteca' },
      { id: ItemCategory.LUBRICANTES, name: 'Lubricantes' },
      { id: ItemCategory.ACCESORIOS, name: 'Accesorios' },
    ];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Server action para crear un nuevo producto en el inventario.
 * 
 * @param {FormData} formData - Los datos del formulario
 * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación
 */
export async function createProduct(formData: FormData) {
  try {
    // Verificar que el usuario tiene una sesión válida
    await verifySession();

    // Extraer y formatear los datos del FormData
    const rawData = Object.fromEntries(formData.entries());
    
    // Validar usando Zod (incluye coerción para los números)
    const validatedData = createProductSchema.parse(rawData);

    // Generar SKU y Slug
    const sku = generateSKU(validatedData.category as ItemCategory);
    const slug = generateSlug(`${validatedData.name} ${validatedData.brand || ''}`);

    // Insertar en la base de datos
    await prisma.product.create({
      data: {
        name: validatedData.name,
        brand: validatedData.brand,
        category: validatedData.category as ItemCategory,
        stock: validatedData.stock,
        unitCost: validatedData.unitCost,
        salePrice: validatedData.salePrice,
        code: sku,
        slug: slug,
        isActive: true,
      },
    });

    return { success: true, message: 'Producto creado exitosamente' };
  } catch (error: any) {
    console.error('Error creating product:', error);
    return { success: false, message: error.message || 'Error al crear el producto' };
  }
}
