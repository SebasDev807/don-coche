/**
 * @jest-environment node
 */
import { getDashboardKPIs } from '../kpis.actions';
import { prismaMock } from '@/lib/singleton';

jest.mock('@/lib/prisma', () => ({
  prisma: require('@/lib/singleton').prismaMock,
}));

jest.mock('@/lib/dal', () => ({
  verifyRole: jest.fn().mockResolvedValue({ userId: '123' }),
  verifySession: jest.fn().mockResolvedValue({ userId: '123' }),
}));

describe('getDashboardKPIs', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  it('calculates correct profitability and daily sales percentage', async () => {
    // Mock de las órdenes de hoy (Total ventas: 200)
    const todaysOrders = [
      {
        id: '1',
        grandTotal: 100,
        products: [{ unitCost: 50, quantity: 1 }],
        services: []
      },
      {
        id: '2',
        grandTotal: 100,
        products: [{ unitCost: 30, quantity: 1 }],
        services: []
      },
    ];

    // Mock de órdenes de ayer (Total ventas: 150)
    // Porcentaje de cambio: ((200 - 150) / 150) * 100 = 33.3%
    const yesterdaysOrders = [
      { id: '3', grandTotal: 150, products: [], services: [] },
    ];

    // Simular llamadas a Prisma en orden
    prismaMock.order.findMany
      .mockResolvedValueOnce(todaysOrders as any) // Primer findMany: ventas de hoy
      .mockResolvedValueOnce(yesterdaysOrders as any); // Segundo findMany: ventas de ayer


    const result = await getDashboardKPIs();

    expect(result.success).toBe(true);
    expect(result.data?.ventasTotales.porcentaje).toBe('+33.3%');
    expect(result.data?.rentabilidad.valor).toBe('60.0%');
  });

  it('handles zero sales yesterday to avoid division by zero', async () => {
    prismaMock.order.findMany
      .mockResolvedValueOnce([{ id: '1', grandTotal: 100, products: [], services: [] }] as any) // Hoy
      .mockResolvedValueOnce([] as any); // Ayer: 0


    const result = await getDashboardKPIs();

    expect(result.success).toBe(true);
    expect(result.data?.ventasTotales.porcentaje).toBe('+100.0%');
  });

  it('handles zero sales today and zero yesterday', async () => {
    prismaMock.order.findMany
      .mockResolvedValueOnce([] as any) // Hoy
      .mockResolvedValueOnce([] as any); // Ayer


    const result = await getDashboardKPIs();

    expect(result.success).toBe(true);
    expect(result.data?.ventasTotales.porcentaje).toBe('0.0%');
    expect(result.data?.rentabilidad.valor).toBe('0.0%');
  });
});
