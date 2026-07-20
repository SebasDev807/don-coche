/**
 * @fileoverview Página principal del Dashboard.
 *
 * Renderiza el resumen financiero consolidado con:
 * - Header con título y subtítulo del rol.
 * - 3 tarjetas KPI (Ventas Totales, Rentabilidad, Inventario Global).
 * - Gráfica de barras CSS (Lavadero vs Serviteca semanal).
 * - Tabla de últimos movimientos con badges de estado.
 *
 * Consume datos mock de `@/data/mocks` para la presentación visual.
 */

import type { Metadata } from 'next';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { verifySession } from '@/lib/dal';
import {
  DASHBOARD_KPIS,
  DASHBOARD_CHART_DATA,
  DASHBOARD_MOVEMENTS,
  MOVEMENT_STATUS_STYLES,
} from '@/data/mocks';

export const metadata: Metadata = {
  title: 'Dashboard | Don Coche',
  description: 'Resumen financiero consolidado',
};

/**
 * Página principal del dashboard con KPIs, gráfica y tabla.
 */
export default async function DashboardPage() {
  const user = await verifySession();

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 fade-in">
      {/* ─── Dashboard Header ─── */}
      <DashboardHeader user={user} />

      {/* ─── KPI Cards ─── */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* KPI 1: Ventas Totales */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant flex flex-col gap-2 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-label-bold text-xs text-on-surface-variant uppercase tracking-wider">
                Ventas Totales del Día
              </h3>
              <div className="w-8 h-8 rounded bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">payments</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <p className="font-display-lg text-headline-lg font-black text-on-surface">
                {DASHBOARD_KPIS.ventasTotales.valor}
              </p>
              <span className="text-[#137333] text-xs font-bold">
                {DASHBOARD_KPIS.ventasTotales.porcentaje}
              </span>
            </div>
            <div className="w-full bg-surface-variant h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#137333] h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${DASHBOARD_KPIS.ventasTotales.progreso}%` }}
              />
            </div>
          </div>

          {/* KPI 2: Rentabilidad Promedio */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant flex flex-col gap-2 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-label-bold text-xs text-on-surface-variant uppercase tracking-wider">
                Rentabilidad Promedio
              </h3>
              <div className="w-8 h-8 rounded bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">monitoring</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <p className="font-display-lg text-headline-lg font-black text-on-surface">
                {DASHBOARD_KPIS.rentabilidad.valor}
              </p>
              <span className="text-on-surface-variant text-xs font-bold">
                {DASHBOARD_KPIS.rentabilidad.meta}
              </span>
            </div>
            <div className="w-full bg-surface-variant h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-on-surface h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${DASHBOARD_KPIS.rentabilidad.progreso}%` }}
              />
            </div>
          </div>

          {/* KPI 3: Valor Inventario Global */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant flex flex-col gap-2 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-label-bold text-xs text-on-surface-variant uppercase tracking-wider">
                Valor Inventario Global
              </h3>
              <div className="w-8 h-8 rounded bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">inventory_2</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <p className="font-display-lg text-headline-lg font-black text-on-surface">
                {DASHBOARD_KPIS.inventarioGlobal.valor}
              </p>
            </div>
            <p className="text-on-surface-variant text-xs mt-2">
              {DASHBOARD_KPIS.inventarioGlobal.nota}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Data Section ─── */}
      <section className="flex flex-col gap-8">
        {/* ─── Gráfica de barras CSS ─── */}
        <div className="bg-surface-container-lowest p-6 md:p-8 rounded-xl border border-surface-variant flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
            <div>
              <h2 className="font-headline-md text-xl text-on-surface font-bold">
                Comparativa de Ingresos
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Rendimiento: Lavadero vs Serviteca (Semana Actual)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-container rounded-sm" />
                <span className="font-label-bold text-xs text-on-surface-variant uppercase">
                  Lavadero
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-tertiary rounded-sm" />
                <span className="font-label-bold text-xs text-on-surface-variant uppercase">
                  Serviteca
                </span>
              </div>
            </div>
          </div>

          {/* Barras */}
          <div className="flex-1 flex items-end justify-between relative mt-8 h-64 border-b border-surface-variant pb-8 px-2 md:px-4">
            {DASHBOARD_CHART_DATA.map((bar) => (
              <div
                key={bar.dia}
                className="flex-1 flex flex-col items-center justify-end h-full relative group"
              >
                <div className="w-10 md:w-16 flex items-end justify-center gap-1 h-full">
                  <div
                    className="w-4 md:w-6 bg-primary-container transition-all duration-500 ease-out"
                    style={{ height: `${bar.lavadero}%` }}
                  />
                  <div
                    className="w-4 md:w-6 bg-tertiary transition-all duration-500 ease-out"
                    style={{ height: `${bar.serviteca}%` }}
                  />
                </div>
                <span className="absolute -bottom-8 font-label-bold text-xs text-on-surface-variant uppercase">
                  {bar.dia}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Tabla de últimos movimientos ─── */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant flex flex-col overflow-hidden">
          <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface-container-lowest">
            <h2 className="font-headline-md text-xl text-on-surface font-bold">
              Resumen de Últimos Movimientos
            </h2>
            <button className="text-on-surface hover:text-on-surface-variant font-label-bold text-sm flex items-center gap-1 transition-colors cursor-pointer">
              Ver Todo{' '}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-lowest font-label-bold text-xs text-on-surface-variant uppercase tracking-wider border-b border-surface-variant">
                <tr>
                  <th className="px-6 py-4 font-normal">Fecha / Hora</th>
                  <th className="px-6 py-4 font-normal">Concepto</th>
                  <th className="px-6 py-4 font-normal">Monto</th>
                  <th className="px-6 py-4 font-normal text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant bg-surface-container-lowest">
                {DASHBOARD_MOVEMENTS.map((movement) => {
                  const statusStyle = MOVEMENT_STATUS_STYLES[movement.estado] ?? {
                    bg: 'bg-surface-variant',
                    text: 'text-on-surface-variant',
                  };

                  return (
                    <tr
                      key={movement.id}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-label-bold text-sm text-on-surface">
                            {movement.fecha}
                          </p>
                          <p className="font-body-md text-xs text-on-surface-variant mt-1">
                            {movement.hora}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-body-md text-sm text-on-surface">
                          {movement.concepto}
                        </p>
                        <p className="font-body-md text-xs text-on-surface-variant mt-1">
                          {movement.detalle}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`font-label-bold text-sm font-bold ${movement.montoColor}`}>
                          {movement.monto}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-label-bold ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          {movement.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
