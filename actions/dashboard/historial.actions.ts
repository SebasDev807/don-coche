'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface MovementFilters {
  plate?: string;
  status?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

function buildWhereOrder(filters: MovementFilters) {
  const where: any = {};

  if (filters.plate && filters.plate.trim() !== '') {
    where.vehicle = {
      plate: {
        contains: filters.plate.trim().toUpperCase(),
      }
    };
  }

  if (filters.status && filters.status !== 'TODOS') {
    where.status = filters.status;
  }

  if (filters.fechaDesde || filters.fechaHasta) {
    where.createdAt = {};
    if (filters.fechaDesde) {
      const desde = new Date(filters.fechaDesde);
      desde.setHours(0, 0, 0, 0);
      where.createdAt.gte = desde;
    }
    if (filters.fechaHasta) {
      const hasta = new Date(filters.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      where.createdAt.lte = hasta;
    }
  }

  return where;
}

function buildWhereSale(filters: MovementFilters) {
  const where: any = {};

  if (filters.plate && filters.plate.trim() !== '') {
    return null;
  }

  if (filters.status && filters.status !== 'TODOS' && filters.status !== 'FACTURADA') {
    return null;
  }

  if (filters.fechaDesde || filters.fechaHasta) {
    where.soldAt = {};
    if (filters.fechaDesde) {
      const desde = new Date(filters.fechaDesde);
      desde.setHours(0, 0, 0, 0);
      where.soldAt.gte = desde;
    }
    if (filters.fechaHasta) {
      const hasta = new Date(filters.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      where.soldAt.lte = hasta;
    }
  }

  return where;
}

export async function getPaginatedMovements(
  page: number = 1,
  limit: number = 50,
  filters: MovementFilters = {}
) {
  try {
    await verifySession();

    const skip = (page - 1) * limit;
    const whereOrder = buildWhereOrder(filters);
    const whereSale = buildWhereSale(filters);

    const orderPromises = [
      prisma.order.findMany({
        where: whereOrder,
        select: { id: true, createdAt: true, grandTotal: true, status: true },
      })
    ];

    if (whereSale !== null) {
      orderPromises.push(
        prisma.productSale.findMany({
          where: whereSale,
          select: { id: true, soldAt: true, grandTotal: true }
        }) as any
      );
    }

    const results = await Promise.all(orderPromises);
    const allOrders = results[0] as any[];
    const allSales = (results[1] || []) as any[];

    const combined = [
      ...allOrders.map(o => ({
        type: 'ORDER',
        id: o.id,
        date: o.createdAt,
        grandTotal: Number(o.grandTotal),
        status: o.status,
      })),
      ...allSales.map(s => ({
        type: 'SALE',
        id: s.id,
        date: s.soldAt,
        grandTotal: Number(s.grandTotal),
        status: 'FACTURADA',
      }))
    ];

    combined.sort((a, b) => b.date.getTime() - a.date.getTime());

    const totalCount = combined.length;
    const totalFacturado = combined
      .filter(item => item.status === 'FACTURADA')
      .reduce((sum, item) => sum + item.grandTotal, 0);

    const countFacturadas = combined.filter(item => item.status === 'FACTURADA').length;
    const countCanceladas = combined.filter(item => item.status === 'CANCELADA').length;
    const countEnPista = combined.filter(item => item.status === 'EN_PISTA').length;

    const paginatedItems = combined.slice(skip, skip + limit);
    const orderIds = paginatedItems.filter(i => i.type === 'ORDER').map(i => i.id);
    const saleIds = paginatedItems.filter(i => i.type === 'SALE').map(i => i.id);

    const [fullOrders, fullSales] = await Promise.all([
      orderIds.length > 0 ? prisma.order.findMany({
        where: { id: { in: orderIds } },
        include: { vehicle: true, services: { include: { service: true } } }
      }) : Promise.resolve([]),
      saleIds.length > 0 ? prisma.productSale.findMany({
        where: { id: { in: saleIds } },
        include: { items: { include: { product: true } }, admin: { select: { name: true } } }
      }) : Promise.resolve([])
    ]);

    const orderMap = new Map(fullOrders.map(o => [o.id, o]));
    const saleMap = new Map(fullSales.map(s => [s.id, s]));

    const movements = paginatedItems.map(item => {
      if (item.type === 'ORDER') {
        const order = orderMap.get(item.id)!;
        const isBilled = order.status === 'FACTURADA';
        const isCanceled = order.status === 'CANCELADA';

        let estado = 'EN PROCESO';
        let montoColor = 'text-[#B06000]';
        if (isBilled) {
          estado = 'COMPLETADO';
          montoColor = 'text-on-surface';
        } else if (isCanceled) {
          estado = 'AUDITADO';
          montoColor = 'text-[#ba1a1a]';
        }

        const concepto = order.services.length > 0
          ? order.services[0].service.name + (order.services.length > 1 ? ` y ${order.services.length - 1} más` : '')
          : 'Sin servicios';

        const rawPlate = order.vehicle?.plate;
        const displayPlate = !rawPlate || rawPlate === 'GEN-000' ? 'N/A' : rawPlate;

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          fecha: order.createdAt.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
          hora: order.createdAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }),
          placa: displayPlate,
          concepto,
          detalle: `Placa: ${displayPlate}`,
          monto: formatCurrency(Number(order.grandTotal)),
          montoRaw: Number(order.grandTotal),
          montoColor,
          estado,
          status: order.status,
        };
      } else {
        const sale = saleMap.get(item.id)!;
        
        const concepto = sale.items.length > 0
          ? sale.items[0].product.name + (sale.items.length > 1 ? ` y ${sale.items.length - 1} más` : '')
          : 'Venta de productos';

        return {
          id: sale.id,
          orderNumber: sale.saleNumber,
          fecha: sale.soldAt.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
          hora: sale.soldAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }),
          placa: 'ALMACÉN',
          concepto,
          detalle: sale.customerName ? `Venta a ${sale.customerName}` : 'Venta Directa',
          monto: formatCurrency(Number(sale.grandTotal)),
          montoRaw: Number(sale.grandTotal),
          montoColor: 'text-on-surface',
          estado: 'COMPLETADO',
          status: 'FACTURADA',
        };
      }
    });

    return {
      success: true,
      data: movements,
      totals: {
        totalFacturado: formatCurrency(totalFacturado),
        totalFacturadoRaw: totalFacturado,
        countFacturadas,
        countCanceladas,
        countEnPista,
        countTotal: totalCount,
      },
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    };
  } catch (error: any) {
    console.error('Error fetching paginated movements:', error);
    return { success: false, data: [], totals: null, pagination: null };
  }
}
