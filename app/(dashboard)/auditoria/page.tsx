import type { Metadata } from 'next';
import { getPaginatedMovements } from '@/actions/dashboard/historial.actions';
import { verifySession } from '@/lib/dal';
import Link from 'next/link';
import { AuditoriaClient } from '@/components/dashboard/auditoria/AuditoriaClient';

export const metadata: Metadata = {
  title: 'Auditoría de Movimientos | Don Coche',
  description: 'Historial completo de órdenes y caja con filtros, búsqueda y exportación',
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    plate?: string;
    status?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }>;
}

export default async function AuditoriaPage({ searchParams }: PageProps) {
  await verifySession();

  const params = await searchParams;

  const page       = params.page ? parseInt(params.page, 10) : 1;
  const plate      = params.plate || '';
  const status     = params.status || 'TODOS';
  const fechaDesde = params.fechaDesde || '';
  const fechaHasta = params.fechaHasta || '';
  const limit      = 50;

  const result = await getPaginatedMovements(page, limit, { plate, status, fechaDesde, fechaHasta });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-4 border-b border-surface-variant pb-6">
        <Link
          href="/"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low text-on-surface hover:bg-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="font-display-md text-3xl font-black text-on-surface">
            Libro Mayor de Auditoría
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Historial completo · Filtros por placa, fecha y estado · Exportación a Excel
          </p>
        </div>
      </div>

      {/* ─── Client Component (filtros + tabla + modal + export) ─── */}
      <AuditoriaClient
        movements={result.data || []}
        totals={result.totals ?? null}
        pagination={result.pagination ?? null}
        filters={{ plate, status, fechaDesde, fechaHasta }}
      />
    </div>
  );
}
