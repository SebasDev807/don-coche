import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateExcelBuffer } from '@/lib/excel-export';
import { verifySession } from '@/lib/dal';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Leer filtros de la URL
    const { searchParams } = request.nextUrl;
    const plate    = searchParams.get('plate') || '';
    const status   = searchParams.get('status') || '';
    const fechaDesde = searchParams.get('fechaDesde') || '';
    const fechaHasta = searchParams.get('fechaHasta') || '';

    // Construir where dinámicamente (misma lógica que el action)
    const where: any = {};

    if (plate.trim() !== '') {
      where.vehicle = { plate: { contains: plate.trim().toUpperCase() } };
    }
    if (status && status !== 'TODOS') {
      where.status = status;
    }
    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) {
        const desde = new Date(fechaDesde);
        desde.setHours(0, 0, 0, 0);
        where.createdAt.gte = desde;
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        where.createdAt.lte = hasta;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { include: { customer: true } },
        technician: { select: { name: true } },
        admin: { select: { name: true } },
        services: { include: { service: true } },
        products: { include: { product: true } },
      },
    });

    const currencyFormat = '"$"#,##0.00;[Red]"-$"#,##0.00';

    const columns = [
      { header: '# Orden',        key: 'orderNumber',   width: 12 },
      { header: 'Placa',          key: 'plate',          width: 14 },
      { header: 'Cliente',        key: 'customer',       width: 30 },
      { header: 'Técnico',        key: 'technician',     width: 25 },
      { header: 'Admin (Cobró)',  key: 'admin',          width: 25 },
      { header: 'Servicios',      key: 'services',       width: 50 },
      { header: 'Productos',      key: 'products',       width: 50 },
      { header: 'Total Servicios', key: 'totalServices', width: 20, style: { numFmt: currencyFormat } },
      { header: 'Total Productos', key: 'totalProducts', width: 20, style: { numFmt: currencyFormat } },
      { header: 'Gran Total',     key: 'grandTotal',     width: 20, style: { numFmt: currencyFormat } },
      { header: 'Método de Pago', key: 'paymentMethod',  width: 20 },
      { header: 'Estado',         key: 'status',         width: 15 },
      { header: 'Fecha Creación', key: 'createdAt',      width: 25 },
      { header: 'Fecha Cobro',    key: 'billedAt',       width: 25 },
    ];

    const formatDate = (date: Date | null) =>
      date
        ? new Date(date).toLocaleDateString('es-CO', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
          })
        : 'N/A';

    const data = orders.map((order) => ({
      orderNumber:    order.orderNumber,
      plate:          order.vehicle.plate,
      customer:       order.vehicle.customer?.name || 'Consumidor Final',
      technician:     order.technician.name,
      admin:          order.admin?.name || 'N/A',
      services:       order.services.map((s: any) => `${s.service.name} ($${Number(s.chargedPrice).toLocaleString('es-CO')})`).join(' | ') || 'Sin servicios',
      products:       order.products.map((p: any) => `${p.product.name} x${p.quantity}`).join(' | ') || 'Sin productos',
      totalServices:  Number(order.totalServices),
      totalProducts:  Number(order.totalProducts),
      grandTotal:     Number(order.grandTotal),
      paymentMethod:  order.paymentMethod || 'N/A',
      status:         order.status,
      createdAt:      formatDate(order.createdAt),
      billedAt:       formatDate(order.billedAt),
    }));

    const buffer = await generateExcelBuffer({
      sheetName: 'Auditoría',
      columns,
      data,
    });

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const today = new Date().toISOString().split('T')[0];
    headers.set('Content-Disposition', `attachment; filename="Auditoria_Don_Coche_${today}.xlsx"`);

    return new Response(buffer as any, { status: 200, headers });
  } catch (error) {
    console.error('Error generating auditoria Excel:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
