'use client';

import React, { useState } from 'react';
import type { AttendanceRecordDTO } from '@/actions/personal/attendance.actions';
import { ExportExcelButton } from '@/components/ui/ExportExcelButton';

interface AttendanceTableProps {
  records: AttendanceRecordDTO[];
}

/**
 * Tabla interactiva para visualizar los registros de asistencia de los empleados.
 * Aplica diseño moderno y etiquetas de estado.
 */
export function AttendanceTable({ records }: AttendanceTableProps) {
  const [isExporting, setIsExporting] = useState(false);

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

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      // Import exceljs dynamically to avoid increasing initial bundle size
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Asistencias');

      // Define columns
      sheet.columns = [
        { header: 'Cédula', key: 'userCc', width: 15 },
        { header: 'Empleado', key: 'userName', width: 25 },
        { header: 'Rol', key: 'userRole', width: 20 },
        { header: 'Fecha', key: 'date', width: 15 },
        { header: 'Entrada', key: 'clockIn', width: 15 },
        { header: 'Salida', key: 'clockOut', width: 15 },
        { header: 'Tiempo Total', key: 'duration', width: 15 },
        { header: 'Horas Extra', key: 'extra', width: 15 },
      ];

      // Style header
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data
      records.forEach(record => {
        sheet.addRow({
          userCc: record.userCc,
          userName: record.userName,
          userRole: record.userRole,
          date: formatDate(record.date),
          clockIn: formatTime(record.clockIn),
          clockOut: formatTime(record.clockOut),
          duration: record.durationMinutes === null 
            ? 'En turno' 
            : `${Math.floor(record.durationMinutes / 60)}h ${record.durationMinutes % 60}m`,
          extra: record.extraMinutes === null
            ? '-'
            : `${Math.floor(record.extraMinutes / 60)}h ${record.extraMinutes % 60}m`
        });
      });

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Asistencias_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Hubo un error al exportar el archivo Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-end">
        <ExportExcelButton 
          onClick={exportToExcel}
          disabled={isExporting || records.length === 0}
        />
      </div>
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant text-on-surface-variant text-sm">
                <th className="py-4 px-6 font-medium">Cédula</th>
                <th className="py-4 px-6 font-medium">Empleado</th>
                <th className="py-4 px-6 font-medium">Rol</th>
                <th className="py-4 px-6 font-medium">Fecha</th>
                <th className="py-4 px-6 font-medium">Entrada</th>
                <th className="py-4 px-6 font-medium">Salida</th>
                <th className="py-4 px-6 font-medium">Tiempo Total</th>
                <th className="py-4 px-6 font-medium">Horas Extra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-on-surface-variant">
                    No hay registros de asistencia para el período seleccionado.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-4 px-6 text-on-surface-variant font-mono">{record.userCc}</td>
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
                    <td className="py-4 px-6 font-medium">
                      {record.extraMinutes ? (
                        <span className="px-2 py-1 bg-tertiary-container text-on-tertiary-container rounded-md text-xs">
                          {Math.floor(record.extraMinutes / 60)}h {record.extraMinutes % 60}m
                        </span>
                      ) : (
                        <span className="text-on-surface-variant">--</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

