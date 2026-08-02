import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateExcelBuffer } from '@/lib/excel-export';
import { verifySession } from '@/lib/dal';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Verificar sesión y permisos
    const session = await verifySession();
    if (!session || !session.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Obtener datos de la base de datos
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        category_rel: true,
      },
      orderBy: {
        barCode: 'asc',
      },
    });

    // 3. Preparar las columnas para Excel
    // Definimos el formato contable
    const currencyFormat = '"$"#,##0.00;[Red]"-$"#,##0.00';
    const percentFormat = '0.00%';

    const columns = [
      { header: 'Código', key: 'barCode', width: 20 },
      { header: 'Nombre', key: 'name', width: 40 },
      { header: 'Categoría', key: 'category', width: 25 },
      { header: 'Stock', key: 'stock', width: 15, style: { alignment: { horizontal: 'right' as const } } },
      { header: 'Costo Unitario', key: 'unitCost', width: 20, style: { numFmt: currencyFormat } },
      { header: 'Precio de Venta', key: 'salePrice', width: 20, style: { numFmt: currencyFormat } },
      { header: '% Ganancia', key: 'profitPercentage', width: 15, style: { numFmt: percentFormat } },
      { header: 'Valor Total Costo', key: 'totalCost', width: 25, style: { numFmt: currencyFormat } },
      { header: 'Valor Total Venta', key: 'totalSale', width: 25, style: { numFmt: currencyFormat } },
    ];

    // 4. Preparar los datos
    const data = products.map((product) => {
      const unitCost = Number(product.unitCost) || 0;
      const salePrice = Number(product.salePrice) || 0;
      const stock = product.stock || 0;
      const profitPercentage = product.profitPercentage ? Number(product.profitPercentage) / 100 : 0; // Excel usa 0.xx para %

      return {
        barCode: product.barCode || '-',
        name: product.name,
        category: product.category_rel?.name || product.category || 'Sin Categoría',
        stock: stock,
        unitCost: unitCost,
        salePrice: salePrice,
        profitPercentage: profitPercentage,
        totalCost: unitCost * stock,
        totalSale: salePrice * stock,
      };
    });

    // 5. Generar el buffer
    const buffer = await generateExcelBuffer({
      sheetName: 'Inventario',
      columns,
      data,
    });

    // 6. Configurar cabeceras de respuesta para forzar descarga
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const today = new Date().toISOString().split('T')[0];
    headers.set('Content-Disposition', `attachment; filename="Inventario_Don_Coche_${today}.xlsx"`);

    return new Response(buffer as any, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error generating Excel export:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
