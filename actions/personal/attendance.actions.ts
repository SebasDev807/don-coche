/**
 * @fileoverview Acciones de servidor (Server Actions) para el seguimiento de asistencias.
 *
 * Contiene funciones para consultar los registros de asistencia (`AttendanceRecord`),
 * filtrarlos por tiempo/empleado y calcular métricas clave para el dashboard.
 */

'use strict';
'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type DateFilter = 'day' | 'week' | 'month' | 'all';

export interface AttendanceRecordDTO {
  id: string;
  userId: string;
  userCc: string;
  userName: string;
  userRole: string;
  date: Date;
  clockIn: Date;
  clockOut: Date | null;
  durationMinutes: number | null;
  extraMinutes: number | null;
}

export interface AttendanceMetrics {
  totalHours: number;
  activeUsers: number;
  totalRecords: number;
}

// ─── Utilidades Privadas ─────────────────────────────────────────────────────

/**
 * Obtiene el rango de fechas (start, end) basado en el filtro deseado.
 */
function getDateRange(filter: DateFilter): { gte: Date; lte: Date } | undefined {
  if (filter === 'all') return undefined;

  const now = new Date();
  let start = new Date(now);

  // Asegurar horas en ceros para el inicio
  start.setHours(0, 0, 0, 0);

  if (filter === 'week') {
    // Restar el día de la semana (0 = Domingo)
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para Lunes como inicio
    start.setDate(diff);
  } else if (filter === 'month') {
    start.setDate(1);
  }

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { gte: start, lte: end };
}

/**
 * Calcula la duración en minutos entre dos fechas.
 */
function calculateDuration(start: Date, end: Date | null): number | null {
  if (!end) return null;
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / 1000 / 60);
}

// ─── Server Actions ──────────────────────────────────────────────────────────

/**
 * Obtiene los registros de asistencia según los filtros proporcionados.
 * 
 * - Si es TÉCNICO, forzamos que solo vea los suyos.
 * - Si es ADMIN/GERENTE, ve todos o el userId filtrado.
 */
export async function getAttendanceRecordsAction(
  filter: DateFilter = 'day',
  targetUserId?: string
): Promise<AttendanceRecordDTO[]> {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');

  const dateRange = getDateRange(filter);
  
  // Determinar permisos
  const isAdminOrManager = ['ADMINISTRADOR', 'GERENTE', 'SUPERUSUARIO'].includes(session.role);
  
  // Si no es admin/gerente, obligatoriamente solo puede ver sus propios registros
  const finalUserId = !isAdminOrManager ? session.userId : targetUserId;

  const records = await prisma.attendanceRecord.findMany({
    where: {
      userId: finalUserId,
      date: dateRange ? { gte: dateRange.gte, lte: dateRange.lte } : undefined,
    },
    include: {
      user: {
        select: {
          cc: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: [
      { date: 'desc' },
      { clockIn: 'desc' },
    ],
  });

  return records.map((record) => {
    const durationMinutes = calculateDuration(record.clockIn, record.clockOut);
    let extraMinutes = null;
    if (durationMinutes !== null && durationMinutes > 480) { // 480 minutos = 8 horas
      extraMinutes = durationMinutes - 480;
    }

    return {
      id: record.id,
      userId: record.userId,
      userCc: record.user.cc,
      userName: record.user.name,
      userRole: record.user.role,
      date: record.date,
      clockIn: record.clockIn,
      clockOut: record.clockOut,
      durationMinutes,
      extraMinutes,
    };
  });
}

/**
 * Calcula las métricas resumidas de asistencia para el período y usuario actual.
 */
export async function getAttendanceMetricsAction(
  filter: DateFilter = 'day',
  targetUserId?: string
): Promise<AttendanceMetrics> {
  const records = await getAttendanceRecordsAction(filter, targetUserId);

  let totalMinutes = 0;
  let activeUsers = 0;

  records.forEach((record) => {
    if (record.durationMinutes !== null) {
      totalMinutes += record.durationMinutes;
    } else {
      activeUsers += 1;
    }
  });

  return {
    totalHours: Number((totalMinutes / 60).toFixed(2)),
    activeUsers,
    totalRecords: records.length,
  };
}
