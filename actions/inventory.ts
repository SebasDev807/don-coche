'use server';

import { prisma } from '@/lib/prisma';
import { createProductSchema, createCategorySchema } from '@/validation';
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
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    return categories.map(cat => ({
      id: cat.id,
      name: cat.name
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Server action para crear una nueva categoría.
 * 
 * @param {FormData} formData - Datos de la categoría
 * @returns {Promise<{success: boolean, message: string, category?: any}>}
 */
export async function createCategory(formData: FormData) {
  try {
    await verifySession();

    const rawData = Object.fromEntries(formData.entries());
    const validatedData = createCategorySchema.parse(rawData);

    // Check if category exists
    const existing = await prisma.category.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive'
        }
      }
    });

    if (existing) {
      return { success: false, message: 'Ya existe una categoría con ese nombre' };
    }

    const slug = generateSlug(validatedData.name);

    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        slug
      }
    });

    return { success: true, message: 'Categoría creada exitosamente', category };
  } catch (error: any) {
    console.error('Error creating category:', error);
    return { success: false, message: error.message || 'Error al crear la categoría' };
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
    const categoryRecord = await prisma.category.findUnique({
      where: { id: validatedData.category }
    });
    const categoryName = categoryRecord?.name || 'GEN';
    const sku = generateSKU(categoryName);
    const slug = generateSlug(`${validatedData.name} ${validatedData.brand || ''}`);

    // Insertar en la base de datos
    await prisma.product.create({
      data: {
        name: validatedData.name,
        brand: validatedData.brand,
        categoryId: validatedData.category,
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
