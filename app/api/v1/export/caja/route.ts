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
    const closureId = searchParams.get('closureId');

    if (!closureId) {
      return new NextResponse('Closure ID required', { status: 400 });
    }

    const closure = await prisma.cashClosure.findUnique({
      where: { id: closureId },
      include: {
        admin: true,
        orders: {
          include: {
            vehicle: true,
            technician: true,
            products: { include: { product: true } },
            services: { include: { service: true } },
          }
        }
      }
    });

    if (!closure) {
      return new NextResponse('Closure not found', { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    
    // --- Hoja 1: Resumen del Cierre ---
    const summarySheet = workbook.addWorksheet('Resumen de Cierre');
    summarySheet.columns = [
      { header: 'Concepto', key: 'concepto', width: 30 },
      { header: 'Valor', key: 'valor', width: 25 },
    ];
    
    const currencyFormat = '"$"#,##0.00;[Red]"-$"#,##0.00';
    
    // Format headers
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F4F4F' } };
    summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    summarySheet.addRows([
      { concepto: 'ID de Cierre', valor: closure.id },
      { concepto: 'Fecha/Hora', valor: closure.createdAt.toLocaleString('es-CO') },
      { concepto: 'Responsable', valor: closure.admin.name },
      { concepto: 'Observaciones', valor: closure.observations || 'N/A' },
      { concepto: '', valor: '' },
      { concepto: 'Total Efectivo (Sistema)', valor: Number(closure.totalCash) },
      { concepto: 'Total Tarjeta', valor: Number(closure.totalCard) },
      { concepto: 'Total Transferencia', valor: Number(closure.totalTransfer) },
      { concepto: 'Efectivo Físico Reportado', valor: Number(closure.reportedCash) },
      { concepto: 'Descuadre en Efectivo', valor: Number(closure.discrepancy) },
    ]);

    // Apply formatting to values
    [6, 7, 8, 9, 10].forEach(rowIndex => {
      summarySheet.getCell(`B${rowIndex}`).numFmt = currencyFormat;
    });

    // --- Hoja 2: Detalle de Órdenes ---
    const detailsSheet = workbook.addWorksheet('Detalle de Órdenes', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    detailsSheet.columns = [
      { header: 'Nº Orden', key: 'orderNumber', width: 15 },
      { header: 'Placa', key: 'plate', width: 15 },
      { header: 'Método de Pago', key: 'paymentMethod', width: 20 },
      { header: 'Técnico', key: 'technician', width: 25 },
      { header: 'Concepto', key: 'concept', width: 40 },
      { header: 'Total Servicios', key: 'totalServices', width: 20, style: { numFmt: currencyFormat } },
      { header: 'Total Productos', key: 'totalProducts', width: 20, style: { numFmt: currencyFormat } },
      { header: 'Total General', key: 'grandTotal', width: 20, style: { numFmt: currencyFormat } },
      { header: 'Facturada en', key: 'billedAt', width: 25 },
    ];

    detailsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F4F4F' } };
    detailsSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    const ordersData = closure.orders.map(order => {
      const servicesNames = order.services.map(s => s.service.name).join(', ');
      const productsNames = order.products.map(p => p.product.name).join(', ');
      let concept = servicesNames;
      if (productsNames) {
        concept += (concept ? ' | ' : '') + productsNames;
      }

      return {
        orderNumber: order.orderNumber,
        plate: order.vehicle.plate,
        paymentMethod: order.paymentMethod || 'NO ESPECIFICADO',
        technician: order.technician.name,
        concept: concept || 'Sin items',
        totalServices: Number(order.totalServices),
        totalProducts: Number(order.totalProducts),
        grandTotal: Number(order.grandTotal),
        billedAt: order.billedAt ? order.billedAt.toLocaleString('es-CO') : '-',
      };
    });

    detailsSheet.addRows(ordersData);

    const lastCol = detailsSheet.getColumn(detailsSheet.columns.length).letter;
    detailsSheet.autoFilter = `A1:${lastCol}1`;

    const buffer = await workbook.xlsx.writeBuffer();

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const safeDate = closure.createdAt.toISOString().split('T')[0];
    headers.set('Content-Disposition', `attachment; filename="Cierre_Caja_${safeDate}.xlsx"`);

    return new Response(buffer as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[Export Caja Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
