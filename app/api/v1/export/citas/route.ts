import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateExcelBuffer } from '@/lib/excel-export';
import { verifySession } from '@/lib/dal';
import type { AppointmentStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Exporta la lista de citas a formato Excel (.xlsx).
 *
 * Acepta query params opcionales para filtrar las citas:
 * - `status` → Filtrar por estado (PENDIENTE, CUMPLIDA, PERDIDA, CANCELADA)
 * - `q` → Búsqueda por nombre de cliente o placa de vehículo
 *
 * @param request - La solicitud HTTP con posibles query params.
 * @returns Respuesta con el archivo Excel o error HTTP.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar sesión
    const session = await verifySession();
    if (!session || !session.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Leer filtros de query params
    const { searchParams } = request.nextUrl;
    const statusParam = searchParams.get('status');
    const query = searchParams.get('q');

    const validStatuses: AppointmentStatus[] = ['PENDIENTE', 'CUMPLIDA', 'PERDIDA', 'CANCELADA'];
    const whereClause: any = {};

    if (statusParam && validStatuses.includes(statusParam as AppointmentStatus)) {
      whereClause.status = statusParam;
    }

    if (query && query.trim().length > 0) {
      whereClause.OR = [
        { customer: { name: { contains: query, mode: 'insensitive' } } },
        { customer: { cc: { contains: query, mode: 'insensitive' } } },
        { vehicle: { plate: { contains: query, mode: 'insensitive' } } },
      ];
    }

    // 3. Obtener datos de la base de datos
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        customer: { select: { name: true, cc: true, phone: true } },
        vehicle: { select: { plate: true, brand: true, model: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // 4. Preparar columnas para Excel
    const columns = [
      { header: 'Cliente', key: 'customerName', width: 25 },
      { header: 'Cédula Cliente', key: 'customerCc', width: 18 },
      { header: 'Teléfono', key: 'customerPhone', width: 18 },
      { header: 'Placa Vehículo', key: 'vehiclePlate', width: 15 },
      { header: 'Vehículo', key: 'vehicleInfo', width: 25 },
      { header: 'Fecha Programada', key: 'scheduledAt', width: 25 },
      { header: 'Descripción', key: 'description', width: 30 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Agendado por', key: 'createdBy', width: 20 },
      { header: 'Notas', key: 'notes', width: 30 },
    ];

    // 5. Mapear a datos planos
    const statusLabels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      CUMPLIDA: 'Cumplida',
      PERDIDA: 'Perdida',
      CANCELADA: 'Cancelada',
    };

    const data = appointments.map((apt) => ({
      customerName: apt.customer.name || 'Sin nombre',
      customerCc: apt.customer.cc || 'N/A',
      customerPhone: apt.customer.phone || 'N/A',
      vehiclePlate: apt.vehicle.plate,
      vehicleInfo: [apt.vehicle.brand, apt.vehicle.model].filter(Boolean).join(' ') || 'N/A',
      scheduledAt: new Date(apt.scheduledAt).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      description: apt.description || 'N/A',
      status: statusLabels[apt.status] || apt.status,
      createdBy: apt.createdBy?.name || 'WhatsApp',
      notes: apt.notes || '',
    }));

    // 6. Generar buffer Excel
    const buffer = await generateExcelBuffer({
      sheetName: 'Citas',
      columns,
      data,
    });

    // 7. Responder con el archivo
    const headers = new Headers();
    headers.set(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    const today = new Date().toISOString().split('T')[0];
    headers.set('Content-Disposition', `attachment; filename="Citas_Don_Coche_${today}.xlsx"`);

    return new Response(buffer as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error generating Excel export for appointments:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
