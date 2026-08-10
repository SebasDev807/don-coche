import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forzar que este endpoint sea siempre dinámico y no se quede en caché
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    
    // Calculamos el tiempo límite: hace 30 días (1 mes)
    const limitTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Buscar usuarios (empleados) que estén inactivos desde hace más de un mes
    const inactiveUsers = await prisma.user.findMany({
      where: {
        isActive: false,
        updatedAt: {
          lt: limitTime,
        },
      },
    });

    if (inactiveUsers.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'No hay usuarios inactivos desde hace más de un mes para eliminar.',
      });
    }

    let deletedCount = 0;
    let failedCount = 0;

    for (const user of inactiveUsers) {
      try {
        // 1. Eliminar sus registros de asistencia (opcional, para evitar constraint de llave foránea si solo tienen asistencias)
        await prisma.attendanceRecord.deleteMany({
          where: { userId: user.id }
        });

        // 2. Intentar eliminar el usuario
        // Nota: Si el usuario tiene órdenes, facturas, o movimientos de inventario asociados, 
        // Prisma lanzará un error para proteger la integridad de los datos históricos del negocio.
        await prisma.user.delete({
          where: { id: user.id },
        });
        
        deletedCount++;
      } catch (error) {
        console.error(`[Cron Inactive Users] Error eliminando usuario ${user.id} (${user.name}):`, error);
        // Fallará intencionalmente si tiene historial de órdenes que no deben borrarse
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      failedCount,
      message: `Proceso finalizado. ${deletedCount} usuarios inactivos eliminados. ${failedCount} usuarios conservados por tener historial de órdenes asociado.`,
    });

  } catch (error) {
    console.error('[Cron Inactive Users] Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error al procesar la limpieza de usuarios' },
      { status: 500 }
    );
  }
}
