import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/dal';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);
    if (!session || !session.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    let startDate = new Date();
    let endDate = new Date();

    if (dateParam && endDateParam) {
      startDate = new Date(dateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateParam) {
      startDate = new Date(dateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const orders = await prisma.order.findMany({
      where: {
        status: 'FACTURADA',
        billedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        technician: true,
        vehicle: true,
        services: {
          include: { service: true }
        },
        products: {
          include: { product: true }
        }
      }
    });

    const productSales = await prisma.productSale.findMany({
      where: {
        soldAt: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        admin: true,
        items: {
          include: { product: true }
        }
      }
    });

    const workbook = new ExcelJS.Workbook();
    
    // --- Hoja: Ventas Detalladas por Técnico/Colaborador ---
    const sheet = workbook.addWorksheet('Resumen de Ventas');
    sheet.columns = [
      { header: 'Colaborador/Técnico', key: 'tech', width: 30 },
      { header: 'Tipo de Documento', key: 'type', width: 20 },
      { header: 'Nº Documento', key: 'doc', width: 15 },
      { header: 'Vehículo', key: 'vehicle', width: 15 },
      { header: 'Monto Total', key: 'total', width: 20, style: { numFmt: '"$"#,##0.00' } },
      { header: 'Método de Pago', key: 'payment', width: 20 },
      { header: 'Fecha y Hora', key: 'time', width: 25 },
    ];
    
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    let totalGlobal = 0;
    
    orders.forEach(order => {
      totalGlobal += Number(order.grandTotal);
      sheet.addRow({
        tech: order.technician.name,
        type: 'Orden de Servicio',
        doc: order.orderNumber,
        vehicle: order.vehicle.plate,
        total: Number(order.grandTotal),
        payment: order.paymentMethod || 'No Especificado',
        time: order.billedAt ? order.billedAt.toLocaleString('es-CO') : '-',
      });
    });

    productSales.forEach(sale => {
      totalGlobal += Number(sale.grandTotal);
      sheet.addRow({
        tech: sale.admin.name,
        type: 'Venta Directa Almacén',
        doc: sale.saleNumber,
        vehicle: 'N/A',
        total: Number(sale.grandTotal),
        payment: sale.paymentMethod || 'No Especificado',
        time: sale.soldAt.toLocaleString('es-CO'),
      });
    });

    sheet.addRow({
      tech: 'TOTAL',
      type: '',
      doc: '',
      vehicle: '',
      total: totalGlobal,
      payment: '',
      time: '',
    }).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const safeStart = startDate.toISOString().split('T')[0];
    const safeEnd = endDate.toISOString().split('T')[0];
    headers.set('Content-Disposition', `attachment; filename="Ventas_Caja_${safeStart}_a_${safeEnd}.xlsx"`);

    return new Response(buffer as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[Export Caja Resumen Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
