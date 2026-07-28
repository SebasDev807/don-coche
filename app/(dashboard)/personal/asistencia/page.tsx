import React from 'react';
import Link from 'next/link';
import { getAttendanceRecordsAction, getAttendanceMetricsAction, DateFilter } from '@/actions/personal/attendance.actions';
import { AttendanceSummary } from '@/components/dashboard/personal/AttendanceSummary';
import { AttendanceTable } from '@/components/dashboard/personal/AttendanceTable';

export const metadata = {
  title: 'Dashboard de Asistencia - Don Coche',
  description: 'Control de asistencia y seguimiento de horas laboradas.',
};

/**
 * Vista principal del Dashboard de Asistencia (Server Component).
 * Renderiza el resumen de métricas y la tabla de auditoría, permitiendo filtrar por fechas.
 */
export default async function AttendanceDashboardPage(props: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const searchParams = await props.searchParams;
  const filter = (searchParams.filter as DateFilter) || 'day';

  // Fetch data in parallel
  const [metrics, records] = await Promise.all([
    getAttendanceMetricsAction(filter),
    getAttendanceRecordsAction(filter),
  ]);

  // Estilos de los botones de filtro
  const getFilterStyle = (currentFilter: string) => {
    return filter === currentFilter
      ? 'bg-primary-container text-on-surface shadow-sm font-bold'
      : 'bg-surface text-on-surface-variant hover:bg-surface-container-high border border-outline-variant';
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control de Asistencia</h1>
          <p className="text-sm text-slate-500 mt-1">
            Auditoría de tiempos, entradas y salidas del personal.
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center space-x-2 bg-surface-container p-1 rounded-lg">
          <Link
            href="/personal/asistencia?filter=day"
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${getFilterStyle('day')}`}
          >
            Hoy
          </Link>
          <Link
            href="/personal/asistencia?filter=week"
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${getFilterStyle('week')}`}
          >
            Esta Semana
          </Link>
          <Link
            href="/personal/asistencia?filter=month"
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${getFilterStyle('month')}`}
          >
            Este Mes
          </Link>
          <Link
            href="/personal/asistencia?filter=all"
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${getFilterStyle('all')}`}
          >
            Todo
          </Link>
        </div>
      </div>

      {/* Resumen (Tarjetas) */}
      <AttendanceSummary metrics={metrics} />

      {/* Tabla Detallada */}
      <div className="flex flex-col space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Registro Detallado</h2>
        <AttendanceTable records={records} />
      </div>
    </div>
  );
}
