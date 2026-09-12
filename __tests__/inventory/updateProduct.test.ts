/**
 * Tests para el Server Action `updateProduct`.
 *
 * Verifican que:
 * - Actualizar el barcode no modifica el IVA existente.
 * - El IVA se actualiza correctamente cuando se envía explícitamente.
 * - `iva: 0` se persiste como 0, no como null.
 * - Campos ausentes (undefined) no sobreescriben valores existentes en DB.
 *
 * Prisma se mockea completamente para que los tests sean unitarios y no
 * requieran conexión a base de datos.
 */

import { updateProduct } from '@/actions/inventory/updateProduct.actions';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Mock de @prisma/client para aislar la lógica del Server Action
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Producto de referencia tal como lo devolvería Prisma (con Decimal) */
const existingProduct = {
  id: 'mock-product-001',
  name: 'Producto de prueba',
  slug: 'producto-de-prueba',
  barCode: '7701234567890',
  description: null,
  categoryId: null,
  category: null,
  stock: 10,
  unitCost: new Prisma.Decimal(50000),
  salePrice: new Prisma.Decimal(71400),
  profitPercentage: new Prisma.Decimal(20),
  iva: new Prisma.Decimal(19),  // ← IVA que debe sobrevivir
  isActive: true,
  imageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(existingProduct);
  (mockPrisma.product.update as jest.Mock).mockImplementation(({ data }) =>
    Promise.resolve({ ...existingProduct, ...data, id: existingProduct.id })
  );
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('updateProduct — campo IVA', () => {
  /**
   * CASO A: Editar solo el barcode.
   * El IVA (19) debe sobrevivir intacto — este es el bug reportado.
   * Si iva no se incluye en el payload el Server Action NO debe modificarlo.
   */
  test('editar barcode no debe sobrescribir el IVA existente', async () => {
    const result = await updateProduct({
      id: 'mock-product-001',
      barCode: '7709876543210',
      // iva no se envía — actualización parcial
    });

    expect(result.success).toBe(true);

    const updateCall = (mockPrisma.product.update as jest.Mock).mock.calls[0][0];

    // barcode debe actualizarse
    expect(updateCall.data.barCode).toBe('7709876543210');

    // iva NO debe estar en updateData — el Server Action solo incluye
    // campos que recibe como !== undefined
    expect(updateCall.data.iva).toBeUndefined();
  });

  /**
   * CASO B: Editar solo el nombre.
   * El IVA también debe sobrevivir.
   */
  test('editar nombre no debe sobrescribir el IVA existente', async () => {
    await updateProduct({
      id: 'mock-product-001',
      name: 'Producto renombrado',
    });

    const updateCall = (mockPrisma.product.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.name).toBe('Producto renombrado');
    expect(updateCall.data.iva).toBeUndefined();
  });

  /**
   * CASO C: El frontend envía iva: 0 (producto exento).
   * El 0 debe persistirse como Decimal(0), no como null ni ser ignorado.
   */
  test('iva: 0 se persiste como Decimal(0), no como null', async () => {
    await updateProduct({
      id: 'mock-product-001',
      iva: 0,
    });

    const updateCall = (mockPrisma.product.update as jest.Mock).mock.calls[0][0];
    // El Server Action convierte a Prisma.Decimal
    expect(updateCall.data.iva).toEqual(new Prisma.Decimal(0));
  });

  /**
   * CASO D: Actualizar el IVA explícitamente a 19.
   */
  test('iva: 19 se persiste correctamente', async () => {
    await updateProduct({
      id: 'mock-product-001',
      iva: 19,
    });

    const updateCall = (mockPrisma.product.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.iva).toEqual(new Prisma.Decimal(19));
  });

  /**
   * CASO E: Actualizar el IVA explícitamente a 5.
   */
  test('iva: 5 se persiste correctamente', async () => {
    await updateProduct({
      id: 'mock-product-001',
      iva: 5,
    });

    const updateCall = (mockPrisma.product.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.iva).toEqual(new Prisma.Decimal(5));
  });

  /**
   * CASO F: Barcode + nombre juntos — IVA no debe aparecer en el update.
   */
  test('editar barcode y nombre juntos no debe tocar el IVA', async () => {
    await updateProduct({
      id: 'mock-product-001',
      barCode: '7709876543210',
      name: 'Producto actualizado',
    });

    const updateCall = (mockPrisma.product.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.barCode).toBe('7709876543210');
    expect(updateCall.data.name).toBe('Producto actualizado');
    expect(updateCall.data.iva).toBeUndefined();
  });

  /**
   * CASO G: Producto sin IVA (iva: null en DB).
   * Editar el barcode no debe convertir null en 0.
   */
  test('producto sin IVA (null) sigue sin IVA después de editar barcode', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce({
      ...existingProduct,
      iva: null,
    });

    await updateProduct({
      id: 'mock-product-001',
      barCode: '7709876543210',
    });

    const updateCall = (mockPrisma.product.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.iva).toBeUndefined();
  });
});

describe('updateProduct — producto no existe', () => {
  test('devuelve error si el producto no se encuentra', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const result = await updateProduct({ id: 'no-existe' });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no fue encontrado/i);
  });
});
