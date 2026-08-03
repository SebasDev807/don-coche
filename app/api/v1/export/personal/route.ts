import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateExcelBuffer } from '@/lib/excel-export';
import { verifySession } from '@/lib/dal';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Verificar sesión y permisos (Solo gerentes/superusuarios deberían exportar personal probablemente, pero usaremos el verifySession general por ahora)
    const session = await verifySession();
    if (!session || !session.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Obtener datos de la base de datos
    const users = await prisma.user.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    // 3. Preparar las columnas para Excel
    const columns = [
      { header: 'CC (Cédula)', key: 'cc', width: 20 },
      { header: 'Nombre', key: 'name', width: 35 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Celular', key: 'celular', width: 20 },
      { header: 'Rol', key: 'role', width: 20 },
      { header: 'Departamento', key: 'department', width: 20 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Fecha de Registro', key: 'createdAt', width: 25 },
    ];

    // 4. Preparar los datos
    const data = users.map((user) => {
      return {
        cc: user.cc,
        name: user.name,
        email: user.email || 'N/A',
        celular: user.celular || 'N/A',
        role: user.role,
        department: user.department || 'N/A',
        status: user.isActive ? 'Activo' : 'Inactivo',
        createdAt: new Date(user.createdAt).toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    });

    // 5. Generar el buffer
    const buffer = await generateExcelBuffer({
      sheetName: 'Personal',
      columns,
      data,
    });

    // 6. Configurar cabeceras de respuesta para forzar descarga
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const today = new Date().toISOString().split('T')[0];
    headers.set('Content-Disposition', `attachment; filename="Personal_Don_Coche_${today}.xlsx"`);

    return new Response(buffer as any, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error generating Excel export for staff:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
