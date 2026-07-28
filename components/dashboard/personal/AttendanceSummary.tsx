'use client';

import React from 'react';
import type { AttendanceMetrics } from '@/actions/personal/attendance.actions';

interface AttendanceSummaryProps {
  metrics: AttendanceMetrics;
}

/**
 * Muestra tarjetas de resumen con las métricas principales de asistencia.
 * 
 * @param {AttendanceMetrics} metrics - Objeto con los totales de horas y usuarios activos.
 */
export function AttendanceSummary({ metrics }: AttendanceSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Tarjeta: Horas Trabajadas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            Total Horas
          </h3>
          <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <p className="text-3xl font-bold text-slate-800">{metrics.totalHours} <span className="text-lg font-normal text-slate-400">h</span></p>
      </div>

      {/* Tarjeta: Empleados Activos (En Turno) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            En Turno Ahora
          </h3>
          <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <p className="text-3xl font-bold text-slate-800">{metrics.activeUsers}</p>
      </div>

      {/* Tarjeta: Total de Registros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            Total Registros
          </h3>
          <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
        </div>
        <p className="text-3xl font-bold text-slate-800">{metrics.totalRecords}</p>
      </div>
    </div>
  );
}
