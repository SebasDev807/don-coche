import { ItemCategory } from '@prisma/client';

/**
 * @fileoverview Funciones de utilidad para generar códigos únicos (SKU).
 */

/**
 * Genera un SKU (Stock Keeping Unit) automático para un producto nuevo.
 * El formato utilizado es: [PREFIJO]-[SECUENCIA_ALEATORIA]
 *
 * Ejemplos:
 * - LUB-A7B2X9 (Lubricantes)
 * - ACC-8N4M1Q (Accesorios)
 * - SRV-P0K2Z5 (Serviteca)
 * - LAV-9C3D8F (Lavadero)
 *
 * @param {ItemCategory} category - La categoría del producto al que se le asignará el SKU.
 * @returns {string} El código SKU autogenerado.
 */
export function generateSKU(category: ItemCategory): string {
  let prefix = 'GEN';

  switch (category) {
    case ItemCategory.LUBRICANTES:
      prefix = 'LUB';
      break;
    case ItemCategory.ACCESORIOS:
      prefix = 'ACC';
      break;
    case ItemCategory.SERVITECA:
      prefix = 'SRV';
      break;
    case ItemCategory.LAVADERO:
      prefix = 'LAV';
      break;
  }

  // Genera un sufijo aleatorio de 6 caracteres alfanuméricos en mayúsculas
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `${prefix}-${randomSuffix}`;
}
