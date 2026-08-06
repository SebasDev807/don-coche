'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { OrderAuditModal } from './OrderAuditModal';
import { MOVEMENT_STATUS_STYLES } from '@/data/mocks';

interface Movement {
  id: string;
  orderNumber: number;
  fecha: string;
  hora: string;
  placa: string;
  concepto: string;
  monto: string;
  montoColor: string;
  estado: string;
  status: string;
}

interface Totals {
  totalFacturado: string;
  totalFacturadoRaw: number;
  countFacturadas: number;
  countCanceladas: number;
  countEnPista: number;
  countTotal: number;
}

interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

interface AuditoriaClientProps {
  movements: Movement[];
  totals: Totals | null;
  pagination: Pagination | null;
  filters: {
    plate: string;
    status: string;
    fechaDesde: string;
    fechaHasta: string;
  };
}

export function AuditoriaClient({ movements, totals, pagination, filters }: AuditoriaClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estado local de los inputs del formulario
  const [plate, setPlate]           = useState(filters.plate);
  const [status, setStatus]         = useState(filters.status || 'TODOS');
  const [fechaDesde, setFechaDesde] = useState(filters.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(filters.fechaHasta);

  // Modal de detalle
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Genera URL con los filtros actuales + paginación
  const buildUrl = useCallback((params: Record<string, string>) => {
    const current = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== '' && v !== 'TODOS') current.set(k, v);
      else current.delete(k);
    });
    return `${pathname}?${current.toString()}`;
  }, [pathname, searchParams]);

  const handleSearch = () => {
    router.push(buildUrl({ plate, status, fechaDesde, fechaHasta, page: '1' }));
  };

  const handleClear = () => {
    setPlate('');
    setStatus('TODOS');
    setFechaDesde('');
    setFechaHasta('');
    router.push(pathname);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (plate)      params.set('plate', plate);
    if (status && status !== 'TODOS') params.set('status', status);
    if (fechaDesde) params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params.set('fechaHasta', fechaHasta);
    const url = `/api/v1/export/auditoria${params.toString() ? '?' + params.toString() : ''}`;
    window.open(url, '_blank');
  };

  const hasFilters = filters.plate || (filters.status && filters.status !== 'TODOS') || filters.fechaDesde || filters.fechaHasta;

  return (
    <>
      {/* ─── Barra de Filtros ─── */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-4 md:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {/* Búsqueda por placa */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Buscar por Placa</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ej: ABC123"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-surface-container border border-surface-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-surface-container border border-surface-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer appearance-none"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="FACTURADA">Completado</option>
              <option value="EN_PISTA">En Proceso</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          {/* Desde */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-surface-container border border-surface-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
            />
          </div>

          {/* Hasta */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-surface-container border border-surface-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2 bg-on-surface text-surface text-sm font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              Buscar
            </button>
            {hasFilters && (
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-surface-variant text-on-surface-variant text-sm font-bold rounded-lg hover:bg-surface-variant transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                Limpiar
              </button>
            )}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-surface-variant text-on-surface text-sm font-bold rounded-lg hover:bg-surface-variant transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Exportar Excel
          </button>
        </div>
      </div>

      {/* ─── Tarjetas de Resumen (cuando hay filtros activos) ─── */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Total Facturado</p>
            <p className="text-xl font-black text-on-surface">{totals.totalFacturado}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Completadas</p>
            <p className="text-xl font-black text-[#137333]">{totals.countFacturadas}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">En Pista</p>
            <p className="text-xl font-black text-[#B06000]">{totals.countEnPista}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Canceladas</p>
            <p className="text-xl font-black text-[#ba1a1a]">{totals.countCanceladas}</p>
          </div>
        </div>
      )}

      {/* ─── Tabla ─── */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant flex flex-col overflow-hidden">
        {movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">search_off</span>
            <p className="text-on-surface-variant text-sm">No se encontraron órdenes con los filtros aplicados.</p>
            {hasFilters && (
              <button onClick={handleClear} className="text-sm font-bold text-on-surface underline underline-offset-2 cursor-pointer">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-lowest font-label-bold text-xs text-on-surface-variant uppercase tracking-wider border-b border-surface-variant">
                <tr>
                  <th className="px-6 py-4 font-normal"># Orden</th>
                  <th className="px-6 py-4 font-normal">Fecha / Hora</th>
                  <th className="px-6 py-4 font-normal">Placa</th>
                  <th className="px-6 py-4 font-normal">Concepto</th>
                  <th className="px-6 py-4 font-normal">Monto</th>
                  <th className="px-6 py-4 font-normal text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant bg-surface-container-lowest">
                {movements.map((movement) => {
                  const statusStyle = MOVEMENT_STATUS_STYLES[movement.estado] ?? {
                    bg: 'bg-surface-variant',
                    text: 'text-on-surface-variant',
                  };
                  return (
                    <tr
                      key={movement.id}
                      onClick={() => setSelectedOrderId(movement.id)}
                      className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">
                          #{movement.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-label-bold text-sm text-on-surface">{movement.fecha}</p>
                        <p className="font-body-md text-xs text-on-surface-variant mt-1">{movement.hora}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded">
                          {movement.placa}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-body-md text-sm text-on-surface">{movement.concepto}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`font-label-bold text-sm font-bold ${movement.montoColor}`}>{movement.monto}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-label-bold ${statusStyle.bg} ${statusStyle.text}`}>
                          {movement.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Paginación ─── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-surface-variant flex items-center justify-between bg-surface-container-lowest">
            <p className="text-xs text-on-surface-variant">
              Página {pagination.currentPage} de {pagination.totalPages} · {pagination.totalCount} registros
            </p>
            <div className="flex gap-2">
              {pagination.currentPage > 1 && (
                <a
                  href={buildUrl({ plate: filters.plate, status: filters.status, fechaDesde: filters.fechaDesde, fechaHasta: filters.fechaHasta, page: String(pagination.currentPage - 1) })}
                  className="px-4 py-2 text-sm font-label-bold rounded border border-surface-variant text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  ← Anterior
                </a>
              )}
              {pagination.currentPage < pagination.totalPages && (
                <a
                  href={buildUrl({ plate: filters.plate, status: filters.status, fechaDesde: filters.fechaDesde, fechaHasta: filters.fechaHasta, page: String(pagination.currentPage + 1) })}
                  className="px-4 py-2 text-sm font-label-bold rounded border border-surface-variant text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Siguiente →
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal de Detalle ─── */}
      <OrderAuditModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </>
  );
}
