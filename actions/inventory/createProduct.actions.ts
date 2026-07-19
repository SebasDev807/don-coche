'use server';

import { prisma } from '@/lib/prisma';
import { ItemCategory, Prisma } from '@prisma/client';
import { generateSKU } from '@/lib/utils/sku';
import { generateSlug } from '@/lib/utils/slug';

/**
 * Propiedades de entrada para la creación de un nuevo producto.
 */
export interface CreateProductInput {
  name: string;
  category: ItemCategory;
  stock: number;
  unitCost: number;
  salePrice: number;
  profitPercentage: number;
}

/**
 * Interfaz de respuesta para el Server Action de crear producto.
 */
export interface CreateProductResponse {
  success: boolean;
  message: string;
  product?: {
    id: string;
    code: string | null;
    name: string;
  };
}

/**
 * Server Action que se encarga de crear un nuevo producto en el inventario.
 * Asigna un SKU automáticamente usando el helper `generateSKU`.
 *
 * @param {CreateProductInput} data - Los datos del formulario del producto.
 * @returns {Promise<CreateProductResponse>} El resultado de la operación.
 */
export async function createProduct(data: CreateProductInput): Promise<CreateProductResponse> {
  try {
    const { name, category, stock, unitCost, salePrice, profitPercentage } = data;

    // Validación básica
    if (!name || !category || unitCost < 0 || salePrice < 0 || stock < 0) {
      return {
        success: false,
        message: 'Por favor completa todos los campos correctamente.',
      };
    }

    // Generar SKU automático y slug
    const code = generateSKU(category);
    const slug = generateSlug(name);

    // Guardar en base de datos
    const newProduct = await prisma.product.create({
      data: {
        code,
        name,
        slug,
        category,
        stock,
        unitCost: new Prisma.Decimal(unitCost),
        salePrice: new Prisma.Decimal(salePrice),
        profitPercentage: new Prisma.Decimal(profitPercentage),
        isActive: true,
      },
    });

    return {
      success: true,
      message: 'Producto creado exitosamente.',
      product: {
        id: newProduct.id,
        code: newProduct.code,
        name: newProduct.name,
      },
    };
  } catch (error) {
    console.error('[createProduct] Error:', error);
    return {
      success: false,
      message: 'Ocurrió un error al intentar crear el producto.',
    };
  }
}
