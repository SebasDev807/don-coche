'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { MOVEMENT_STATUS_STYLES } from '@/data/mocks';

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function getDashboardKPIs() {
  try {
    const user = await verifySession();

    // Ventas Totales de hoy (status = FACTURADA)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysOrders = await prisma.order.findMany({
      where: {
        status: 'FACTURADA',
        billedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        products: {
          include: { product: true }
        }
      }
    });

    const totalSales = todaysOrders.reduce((sum, order) => sum + Number(order.grandTotal), 0);

    // Rentabilidad Promedio de los productos vendidos hoy
    // Formula: ((salePrice - unitCost) / salePrice)
    let totalProfitMargin = 0;
    let productCount = 0;

    for (const order of todaysOrders) {
      for (const orderProduct of order.products) {
        const salePrice = Number(orderProduct.unitPrice);
        const unitCost = Number(orderProduct.unitCost);
        if (salePrice > 0) {
          const margin = (salePrice - unitCost) / salePrice;
          // Ponderar por cantidad
          totalProfitMargin += margin * orderProduct.quantity;
          productCount += orderProduct.quantity;
        }
      }
    }

    const averageMargin = productCount > 0 ? (totalProfitMargin / productCount) * 100 : 0;

    // Valor Inventario Global (sólo para GERENTE o SUPERUSUARIO)
    let inventoryValueFormatted = 'Acceso Restringido';
    let inventoryNote = 'Requiere permisos de gerencia';

    if (user.role === 'GERENTE' || user.role === 'SUPERUSUARIO') {
      const activeProducts = await prisma.product.findMany({
        where: { isActive: true }
      });
      const inventoryTotal = activeProducts.reduce((sum, p) => sum + (p.stock * Number(p.unitCost)), 0);
      inventoryValueFormatted = formatCurrency(inventoryTotal);
      inventoryNote = 'Sujeto a auditoria de cierres';
    }

    return {
      success: true,
      data: {
        ventasTotales: {
          valor: formatCurrency(totalSales),
          porcentaje: '+0.0%', // Placeholder, requiere comparar con ayer
          progreso: Math.min(100, (totalSales / 2000000) * 100), // Meta simulada de 2M
        },
        rentabilidad: {
          valor: `${averageMargin.toFixed(1)}%`,
          meta: 'META: 30%',
          progreso: Math.min(100, (averageMargin / 30) * 100),
        },
        inventarioGlobal: {
          valor: inventoryValueFormatted,
          nota: inventoryNote,
        },
      },
    };
  } catch (error: any) {
    console.error('Error fetching KPIs:', error);
    return { success: false, message: error.message };
  }
}

export async function getWeeklyChartData() {
  try {
    await verifySession();

    // Obtener la semana actual (de Lunes a Domingo)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const data = [];
    const daysMap = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];
    // Generar estructura de la semana actual (Lunes a Domingo)
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      data.push({
        date: date, // guardamos el objeto Date para comparar luego
        dia: daysMap[date.getDay()],
        lavadero: 0,
        serviteca: 0
      });
    }

    const startOfWeekDate = data[0].date;
    const endOfWeekDate = new Date(data[6].date);
    endOfWeekDate.setHours(23, 59, 59, 999);

    const ordersThisWeek = await prisma.order.findMany({
      where: {
        status: 'FACTURADA',
        billedAt: {
          gte: startOfWeekDate,
          lte: endOfWeekDate,
        }
      },
      include: {
        services: { include: { service: true } }
      }
    });

    for (const order of ordersThisWeek) {
      if (!order.billedAt) continue;

      const orderDateStr = order.billedAt.toDateString();
      const dayData = data.find(d => d.date.toDateString() === orderDateStr);

      if (dayData) {
        for (const s of order.services) {
          const price = Number(s.chargedPrice);
          if (s.service.category === 'LAVADERO') {
            dayData.lavadero += price;
          } else if (s.service.category === 'SERVITECA') {
            dayData.serviteca += price;
          } else {
            // Por defecto sumar a lavadero si no tiene categoría
            dayData.lavadero += price;
          }
        }
      }
    }

    return {
      success: true,
      // Retornar sin los objetos date puros para que se pueda serializar al cliente
      data: data.map(({ dia, lavadero, serviteca }) => ({ dia, lavadero, serviteca }))
    };
  } catch (error: any) {
    console.error('Error fetching chart data:', error);
    return { success: false, data: [] };
  }
}

export async function getRecentMovements() {
  try {
    await verifySession();

    const orders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: true,
        services: { include: { service: true } }
      }
    });

    const movements = orders.map((order) => {
      const isBilled = order.status === 'FACTURADA';
      const isCanceled = order.status === 'CANCELADA';

      let estado = 'EN PROCESO';
      let montoColor = 'text-[#B06000]';
      if (isBilled) {
        estado = 'COMPLETADO';
        montoColor = 'text-on-surface';
      } else if (isCanceled) {
        estado = 'AUDITADO'; // Usando estilo neutral para cancelado o auditar
        montoColor = 'text-[#ba1a1a]';
      }

      // Tomamos el primer servicio como concepto
      const concepto = order.services.length > 0
        ? order.services[0].service.name + (order.services.length > 1 ? ` y ${order.services.length - 1} más` : '')
        : 'Sin servicios';

      return {
        id: order.id,
        fecha: order.createdAt.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
        hora: order.createdAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }),
        concepto,
        detalle: `Placa: ${order.vehicle.plate}`,
        monto: formatCurrency(Number(order.grandTotal)),
        montoColor,
        estado
      };
    });

    return { success: true, data: movements };
  } catch (error: any) {
    console.error('Error fetching recent movements:', error);
    return { success: false, data: [] };
  }
}
