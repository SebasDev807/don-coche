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
    const dateParam = searchParams.get('date');

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        status: 'FACTURADA',
        billedAt: {
          gte: targetDate,
          lte: endDate,
        },
      },
      include: {
        technician: true,
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
          gte: targetDate,
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
    
    // --- Hoja 1: Ventas por Técnico (Servicios) ---
    const techSheet = workbook.addWorksheet('Servicios por Técnico');
    techSheet.columns = [
      { header: 'Técnico', key: 'tech', width: 25 },
      { header: 'Nº Orden', key: 'order', width: 15 },
      { header: 'Servicio', key: 'service', width: 35 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Valor Cobrado', key: 'price', width: 20, style: { numFmt: '"$"#,##0.00' } },
      { header: 'Hora', key: 'time', width: 20 },
    ];
    
    techSheet.getRow(1).font = { bold: true };
    techSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    let totalServices = 0;
    
    orders.forEach(order => {
      order.services.forEach(os => {
        totalServices += Number(os.chargedPrice);
        techSheet.addRow({
          tech: order.technician.name,
          order: order.orderNumber,
          service: os.service.name,
          category: os.service.category || 'N/A',
          price: Number(os.chargedPrice),
          time: order.billedAt ? order.billedAt.toLocaleString('es-CO') : '-',
        });
      });
    });

    techSheet.addRow({
      tech: 'TOTAL',
      order: '',
      service: '',
      category: '',
      price: totalServices,
      time: ''
    }).font = { bold: true };


    // --- Hoja 2: Ventas de Productos ---
    const prodSheet = workbook.addWorksheet('Productos Vendidos');
    prodSheet.columns = [
      { header: 'Origen', key: 'origin', width: 20 },
      { header: 'Responsable', key: 'resp', width: 25 },
      { header: 'Nº Documento', key: 'doc', width: 15 },
      { header: 'Producto', key: 'product', width: 35 },
      { header: 'Cantidad', key: 'qty', width: 15 },
      { header: 'Precio Unitario', key: 'unitPrice', width: 20, style: { numFmt: '"$"#,##0.00' } },
      { header: 'Subtotal', key: 'subtotal', width: 20, style: { numFmt: '"$"#,##0.00' } },
      { header: 'Hora', key: 'time', width: 20 },
    ];

    prodSheet.getRow(1).font = { bold: true };
    prodSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    let totalProducts = 0;

    orders.forEach(order => {
      order.products.forEach(op => {
        const sub = Number(op.unitPrice) * op.quantity;
        totalProducts += sub;
        prodSheet.addRow({
          origin: 'Orden de Servicio',
          resp: order.technician.name,
          doc: order.orderNumber,
          product: op.product.name,
          qty: op.quantity,
          unitPrice: Number(op.unitPrice),
          subtotal: sub,
          time: order.billedAt ? order.billedAt.toLocaleString('es-CO') : '-',
        });
      });
    });

    productSales.forEach(sale => {
      sale.items.forEach(item => {
        const sub = Number(item.unitPrice) * item.quantity;
        totalProducts += sub;
        prodSheet.addRow({
          origin: 'Venta Directa Almacén',
          resp: sale.admin.name,
          doc: sale.saleNumber,
          product: item.product.name,
          qty: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: sub,
          time: sale.soldAt.toLocaleString('es-CO'),
        });
      });
    });

    prodSheet.addRow({
      origin: 'TOTAL',
      resp: '',
      doc: '',
      product: '',
      qty: '',
      unitPrice: '',
      subtotal: totalProducts,
      time: ''
    }).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const safeDate = targetDate.toISOString().split('T')[0];
    headers.set('Content-Disposition', `attachment; filename="Ventas_Dia_${safeDate}.xlsx"`);

    return new Response(buffer as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[Export Ventas Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
