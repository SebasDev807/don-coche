import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateExcelBuffer } from '@/lib/excel-export';
import { verifySession } from '@/lib/dal';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const services = await prisma.serviceCatalog.findMany({
      where: {
        isActive: true,
      },
      include: {
        category_rel: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const currencyFormat = '"$"#,##0.00;[Red]"-$"#,##0.00';
    const percentFormat = '0.00%';

    const columns = [
      { header: 'Nombre del Servicio', key: 'name', width: 40 },
      { header: 'Categoría', key: 'category', width: 25 },
      { header: 'Precio Base', key: 'basePrice', width: 20, style: { numFmt: currencyFormat } },
      { header: '% Ganancia', key: 'profitPercentage', width: 15, style: { numFmt: percentFormat } },
      { header: 'Descripción', key: 'description', width: 50 },
    ];

    const data = services.map((service) => {
      const basePrice = Number(service.basePrice) || 0;
      const profitPercentage = service.profitPercentage ? Number(service.profitPercentage) / 100 : 0;

      return {
        name: service.name,
        category: service.category_rel?.name || service.category || 'Sin Categoría',
        basePrice: basePrice,
        profitPercentage: profitPercentage,
        description: service.description || 'Sin descripción',
      };
    });

    const buffer = await generateExcelBuffer({
      sheetName: 'Catálogo de Servicios',
      columns,
      data,
    });

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const today = new Date().toISOString().split('T')[0];
    headers.set('Content-Disposition', `attachment; filename="Servicios_Don_Coche_${today}.xlsx"`);

    return new Response(buffer as any, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error generating Excel export for services:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
