/**
 * @jest-environment node
 */
import { billOrder } from '../admin.actions';
import { prismaMock } from '@/lib/singleton';

jest.mock('@/lib/prisma', () => ({
  prisma: require('@/lib/singleton').prismaMock,
}));

// Mocks de dependencias externas
jest.mock('@/lib/dal', () => ({
  verifyRole: jest.fn().mockResolvedValue({ userId: 'admin-123' }),
  verifySession: jest.fn().mockResolvedValue({ userId: 'admin-123' }),
}));

jest.mock('@/lib/whatsapp', () => ({
  sendReceiptNotification: jest.fn(),
  sendNextAppointmentNotification: jest.fn(),
  sendServiceReminderNotification: jest.fn(),
}));

jest.mock('@/lib/services/aliaddo', () => ({
  AliaddoService: {
    createInvoice: jest.fn().mockResolvedValue({ id: 'aliaddo-123', cufe: 'cufe-123' }),
  },
}));

// Mock de next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock de next/server
jest.mock('next/server', () => ({
  after: jest.fn(), // No ejecutamos el callback de background para evitar open handles
}));

describe('billOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully bills an order and updates inventory', async () => {
    // 1. Mock the transaction to execute the callback immediately
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      return cb(prismaMock);
    });

    const mockOrder = {
      id: 'order-1',
      status: 'EN_PISTA',
      orderNumber: 100,
      totalServices: 50,
      totalProducts: 20,
      grandTotal: 70,
      aliaddoInvoiceId: null,
      cufe: null,
      products: [{ productId: 'prod-1', quantity: 2 }],
      vehicle: {
        plate: 'XYZ123',
        customer: { name: 'Juan', phone: '3000000000' }
      },
      services: [],
    };

    // 2. Setup database mocks
    prismaMock.order.findUnique.mockResolvedValueOnce(mockOrder as any);

    prismaMock.product.findUnique.mockResolvedValueOnce({
      id: 'prod-1',
      stock: 10,
    } as any);

    prismaMock.product.update.mockResolvedValueOnce({} as any);
    prismaMock.inventoryMovement.create.mockResolvedValueOnce({} as any);
    prismaMock.order.update.mockResolvedValueOnce(mockOrder as any);

    const result = await billOrder('order-1', 'EFECTIVO');

    // 3. Verify assertions
    expect(result.success).toBe(true);

    // Verify stock deduction
    expect(prismaMock.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stock: 8 }, // 10 initial - 2 quantity
    });

    // Verify inventory movement creation
    expect(prismaMock.inventoryMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'VENTA',
        quantity: -2,
        newStock: 8,
      }),
    });
  });

  it('fails if order is already billed', async () => {
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      return cb(prismaMock);
    });

    const mockOrder = {
      id: 'order-2',
      status: 'FACTURADA', // Already billed
      products: [],
    };

    prismaMock.order.findUnique.mockResolvedValueOnce(mockOrder as any);

    const result = await billOrder('order-2', 'TARJETA');
    expect(result.success).toBe(false);
    expect(result.message).toBe('La orden no está en pista o no existe.');
  });
});
