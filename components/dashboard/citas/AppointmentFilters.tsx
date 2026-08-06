'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Estados posibles de una cita para el filtro.
 * Cada entrada mapea el valor del enum Prisma a una etiqueta legible en español.
 */
const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'CUMPLIDA', label: 'Cumplida' },
  { value: 'PERDIDA', label: 'Perdida' },
  { value: 'CANCELADA', label: 'Cancelada' },
] as const;

/**
 * Barra de filtros para la vista de citas.
 *
 * Sincroniza los filtros con los `searchParams` de la URL para que el
 * filtrado sea server-side y se pueda compartir/bookmarkear la vista.
 *
 * Incluye:
 * - Select de estado de la cita
 * - Campo de búsqueda por nombre de cliente o placa
 *
 * @returns {JSX.Element} La barra de filtros renderizada.
 */
export function AppointmentFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get('status') ?? 'PENDIENTE';
  const currentQuery = searchParams.get('q') ?? '';

  /**
   * Actualiza un parámetro de búsqueda en la URL sin recargar la página.
   */
  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      {/* Filtro por estado */}
      <div className="relative flex-shrink-0">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px] pointer-events-none">
          filter_list
        </span>
        <select
          id="appointment-status-filter"
          value={currentStatus}
          onChange={(e) => updateParam('status', e.target.value)}
          className="
            h-touch-target-min pl-10 pr-10 
            border border-outline-variant bg-surface-container-lowest 
            text-on-surface font-body-md rounded-lg
            hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary
            transition-colors cursor-pointer appearance-none
            w-full sm:w-auto
          "
          aria-label="Filtrar por estado"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary text-[18px] pointer-events-none">
          expand_more
        </span>
      </div>

      {/* Búsqueda por texto */}
      <div className="relative flex-1 min-w-0 max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px] pointer-events-none">
          search
        </span>
        <input
          id="appointment-search"
          type="text"
          placeholder="Buscar por cliente o placa..."
          defaultValue={currentQuery}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParam('q', (e.target as HTMLInputElement).value);
            }
          }}
          onBlur={(e) => {
            if (e.target.value !== currentQuery) {
              updateParam('q', e.target.value);
            }
          }}
          className="
            h-touch-target-min w-full pl-10 pr-4
            border border-outline-variant bg-surface-container-lowest 
            text-on-surface font-body-md rounded-lg
            placeholder:text-surface-variant
            hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary
            transition-colors
          "
          aria-label="Buscar citas"
        />
      </div>
    </div>
  );
}
