'use server';

import { prisma } from '@/lib/prisma';
import { createProductSchema, createCategorySchema } from '@/validation';
import { generateSlug } from '@/lib/utils/slug';
import { verifySession, verifyRole } from '@/lib/dal';
import { ItemCategory, Prisma } from '@prisma/client';

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
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'AUXILIAR_ADMINISTRATIVO']);

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
  let validatedData: ReturnType<typeof createProductSchema.parse> | null = null;
  let barCode: string | null = null;
  let slug: string | null = null;
  try {
    // Verificar que el usuario tiene una sesión válida y el rol adecuado
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'AUXILIAR_ADMINISTRATIVO']);

    // Extraer y formatear los datos del FormData
    const rawData = Object.fromEntries(formData.entries());

    // Validar usando Zod (incluye coerción para los números)
    validatedData = createProductSchema.parse(rawData);

    // Generar Barcode y Slug
    const categoryRecord = await prisma.category.findUnique({
      where: { id: validatedData.category }
    });
    barCode = validatedData.barCode || null;
    slug = generateSlug(validatedData.name);

    const unitCostBase = validatedData.unitCost;
    const profitPercentage = validatedData.profitPercentage || 0;
    const iva = validatedData.hasIva ? (validatedData.iva !== undefined ? validatedData.iva : 19) : 0;
    // Aplicar IVA al costo neto para obtener el precio base con impuesto
    const costWithIva = unitCostBase * (1 + iva / 100);
    
    // Cálculo del precio de venta: costo con IVA × (1 + margen)
    let computedSalePrice = costWithIva * (1 + (profitPercentage / 100));
    
    if (validatedData.autoRound) {
      computedSalePrice = Math.round(computedSalePrice / 50) * 50;
    }

    await prisma.product.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        categoryId: validatedData.category,
        stock: validatedData.stock,
        unitCost: unitCostBase,
        salePrice: computedSalePrice,
        profitPercentage: profitPercentage,
        iva: iva,
        barCode: barCode,
        slug: slug,
        isActive: true,
      },
    });

    return { success: true, message: 'Producto creado exitosamente' };
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Buscar el producto existente (por barcode o por slug) para ofrecer actualización
        const barCodeUsed = validatedData?.barCode;
        let existing = barCodeUsed
          ? await prisma.product.findUnique({ where: { barCode: barCodeUsed } })
          : null;
        if (!existing && slug) {
          existing = await prisma.product.findUnique({ where: { slug } });
        }
        if (existing) {
          const conflictField = barCodeUsed && existing.barCode === barCodeUsed ? 'código de barras' : 'nombre';
          return {
            success: false,
            conflict: true,
            existingProductId: existing.id,
            existingProductName: existing.name,
            message: `El ${conflictField} ya pertenece al producto "${existing.name}".`,
          };
        }
        return {
          success: false,
          message: 'Ya existe otro producto con este código de barras o nombre. Usa uno distinto.',
        };
      }
    }

    return { success: false, message: error.message || 'Error al crear el producto' };
  }
}

