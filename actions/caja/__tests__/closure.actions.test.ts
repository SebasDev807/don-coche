/**
 * @jest-environment node
 */
import { closeCashRegister } from '../closure.actions';
import { prismaMock } from '@/lib/singleton';

jest.mock('@/lib/prisma', () => ({
  prisma: require('@/lib/singleton').prismaMock,
}));

jest.mock('@/lib/dal', () => ({
  verifyRole: jest.fn().mockResolvedValue({ userId: '123' }),
  verifySession: jest.fn().mockResolvedValue({ userId: '123' }),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('closeCashRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      return cb(prismaMock);
    });
  });

  it('successfully creates a closure with discrepancies', async () => {
    const input = {
      reportedCash: 900,
      totalCash: 1000,
      totalCard: 500,
      totalTransfer: 200,
      observations: 'Faltante de 100',
      orderIds: ['1', '2'],
    };

    // Simulate Prisma creating the cash closure
    prismaMock.cashClosure.create.mockResolvedValue({
      id: 'closure-123',
      date: new Date(),
      totalCash: 1000,
      reportedCash: 900,
      totalCard: 500,
      totalTransfer: 200,
      discrepancy: -100,
      observations: 'Faltante de 100',
    } as any);

    // Simulate order updates
    prismaMock.order.updateMany.mockResolvedValue({ count: 2 } as any);

    const result = await closeCashRegister(input);

    expect(result.success).toBe(true);
    expect(result.closureId).toBe('closure-123');

    // Verify correct logic was passed to Prisma
    expect(prismaMock.cashClosure.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        totalCash: 1000,
        reportedCash: 900,
        discrepancy: -100,
        observations: 'Faltante de 100',
      }),
    });
  });

  it('successfully creates a closure with exact match', async () => {
    const input = {
      reportedCash: 1000,
      totalCash: 1000,
      totalCard: 0,
      totalTransfer: 0,
      observations: 'Cuadrado',
      orderIds: ['order-2'],
    };

    prismaMock.cashClosure.create.mockResolvedValue({ id: 'closure-456' } as any);
    prismaMock.order.updateMany.mockResolvedValue({ count: 0 } as any);

    const result = await closeCashRegister(input);

    expect(result.success).toBe(true);
    expect(prismaMock.cashClosure.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        discrepancy: 0,
      }),
    });
  });
});
