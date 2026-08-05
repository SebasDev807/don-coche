'use client';

import React from 'react';
import type { AttendanceRecordDTO } from '@/actions/personal/attendance.actions';

interface AttendanceTableProps {
  records: AttendanceRecordDTO[];
}

/**
 * Tabla interactiva para visualizar los registros de asistencia de los empleados.
 * Aplica diseño moderno y etiquetas de estado.
 */
export function AttendanceTable({ records }: AttendanceTableProps) {
  // Función para formatear fechas a texto legible local
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date)).replace(/\u202F|\u00A0/g, ' ');
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--';
    return new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date)).replace(/\u202F|\u00A0/g, ' ');
  };

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return <span className="text-emerald-500 font-medium">En turno</span>;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container border-b border-outline-variant text-on-surface-variant text-sm">
              <th className="py-4 px-6 font-medium">Empleado</th>
              <th className="py-4 px-6 font-medium">Rol</th>
              <th className="py-4 px-6 font-medium">Fecha</th>
              <th className="py-4 px-6 font-medium">Entrada</th>
              <th className="py-4 px-6 font-medium">Salida</th>
              <th className="py-4 px-6 font-medium">Tiempo Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm">
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                  No hay registros de asistencia para el período seleccionado.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="hover:bg-surface-container transition-colors">
                  <td className="py-4 px-6 font-medium text-on-surface">{record.userName}</td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-surface-container-high text-on-surface-variant">
                      {record.userRole}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-on-surface-variant">{formatDate(record.date)}</td>
                  <td className="py-4 px-6 text-on-surface-variant font-mono">{formatTime(record.clockIn)}</td>
                  <td className="py-4 px-6 text-on-surface-variant font-mono">{formatTime(record.clockOut)}</td>
                  <td className="py-4 px-6 font-medium text-on-surface">
                    {formatDuration(record.durationMinutes)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
