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

function buildWhereClause(filters: MovementFilters) {
  const where: any = {};

  // Filtro por placa: busca vehículos cuya placa contenga el texto
  if (filters.plate && filters.plate.trim() !== '') {
    where.vehicle = {
      plate: {
        contains: filters.plate.trim().toUpperCase(),
      }
    };
  }

  // Filtro por estado
  if (filters.status && filters.status !== 'TODOS') {
    where.status = filters.status;
  }

  // Filtro por rango de fechas (sobre createdAt)
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

export async function getPaginatedMovements(
  page: number = 1,
  limit: number = 50,
  filters: MovementFilters = {}
) {
  try {
    await verifySession();

    const skip = (page - 1) * limit;
    const where = buildWhereClause(filters);

    const [totalCount, orders, allFilteredOrders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: true,
          services: { include: { service: true } }
        }
      }),
      // Para los totales del período completo (sin paginar)
      prisma.order.findMany({
        where,
        select: {
          grandTotal: true,
          status: true,
        }
      })
    ]);

    // Calcular totales del período filtrado
    const totalFacturado = allFilteredOrders
      .filter(o => o.status === 'FACTURADA')
      .reduce((sum, o) => sum + Number(o.grandTotal), 0);
    const countFacturadas = allFilteredOrders.filter(o => o.status === 'FACTURADA').length;
    const countCanceladas = allFilteredOrders.filter(o => o.status === 'CANCELADA').length;
    const countEnPista = allFilteredOrders.filter(o => o.status === 'EN_PISTA').length;

    const movements = orders.map((order) => {
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

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        fecha: order.createdAt.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
        hora: order.createdAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }),
        placa: order.vehicle?.plate || 'Desconocida',
        concepto,
        detalle: `Placa: ${order.vehicle?.plate || 'Desconocida'}`,
        monto: formatCurrency(Number(order.grandTotal)),
        montoRaw: Number(order.grandTotal),
        montoColor,
        estado,
        status: order.status,
      };
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
