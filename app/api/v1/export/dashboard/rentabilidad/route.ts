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
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let startDate = new Date();
    let endDate = new Date();

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to today
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
        items: {
          include: { product: true }
        }
      }
    });

    const workbook = new ExcelJS.Workbook();
    
    // --- Hoja 1: Resumen General ---
    const summarySheet = workbook.addWorksheet('Rentabilidad General');
    summarySheet.columns = [
      { header: 'Concepto', key: 'concept', width: 40 },
      { header: 'Valor', key: 'value', width: 25, style: { numFmt: '"$"#,##0.00' } },
    ];
    
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    let totalSales = 0;
    let totalCost = 0;

    orders.forEach(order => {
      totalSales += Number(order.grandTotal);
      order.products.forEach(op => {
        totalCost += Number(op.unitCost) * op.quantity;
      });
      order.services.forEach(os => {
        totalCost += Number(os.service.basePrice);
      });
    });

    productSales.forEach(sale => {
      totalSales += Number(sale.grandTotal);
      sale.items.forEach(item => {
        totalCost += Number(item.unitCost) * item.quantity;
      });
    });

    const totalProfit = totalSales - totalCost;
    const margin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

    summarySheet.addRows([
      { concept: 'Total Ventas (Ingresos)', value: totalSales },
      { concept: 'Total Costos', value: totalCost },
      { concept: 'Utilidad Bruta', value: totalProfit },
      { concept: 'Margen de Rentabilidad (%)', value: margin / 100 } // Format as percentage
    ]);

    summarySheet.getCell('B5').numFmt = '0.00%';

    // --- Hoja 2: Detalle por Ítem (Órdenes y Ventas) ---
    const detailSheet = workbook.addWorksheet('Detalle de Ítems');
    detailSheet.columns = [
      { header: 'Tipo', key: 'type', width: 20 }, // Servicio, Producto (Orden), Producto (Almacén)
      { header: 'Nombre', key: 'name', width: 40 },
      { header: 'Venta', key: 'sale', width: 20, style: { numFmt: '"$"#,##0.00' } },
      { header: 'Costo', key: 'cost', width: 20, style: { numFmt: '"$"#,##0.00' } },
      { header: 'Utilidad', key: 'profit', width: 20, style: { numFmt: '"$"#,##0.00' } },
    ];
    
    detailSheet.getRow(1).font = { bold: true };
    detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    orders.forEach(order => {
      order.services.forEach(os => {
        const sale = Number(os.chargedPrice);
        const cost = Number(os.service.basePrice);
        detailSheet.addRow({
          type: 'Servicio',
          name: os.service.name,
          sale: sale,
          cost: cost,
          profit: sale - cost
        });
      });
      
      order.products.forEach(op => {
        const sale = Number(op.unitPrice) * op.quantity;
        const cost = Number(op.unitCost) * op.quantity;
        detailSheet.addRow({
          type: 'Producto (Orden)',
          name: op.product.name,
          sale: sale,
          cost: cost,
          profit: sale - cost
        });
      });
    });

    productSales.forEach(sale => {
      sale.items.forEach(item => {
        const saleValue = Number(item.unitPrice) * item.quantity;
        const cost = Number(item.unitCost) * item.quantity;
        detailSheet.addRow({
          type: 'Producto (Venta Directa)',
          name: item.product.name,
          sale: saleValue,
          cost: cost,
          profit: saleValue - cost
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const safeStart = startDate.toISOString().split('T')[0];
    const safeEnd = endDate.toISOString().split('T')[0];
    headers.set('Content-Disposition', `attachment; filename="Rentabilidad_${safeStart}_a_${safeEnd}.xlsx"`);

    return new Response(buffer as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[Export Rentabilidad Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
