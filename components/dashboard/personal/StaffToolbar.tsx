'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ExportExcelButton } from '@/components/ui';

/**
 * Componente que renderiza la barra de herramientas (Toolbar) de la sección personal.
 * 
 * Contiene el campo de búsqueda de empleados y los botones de acción para
 * filtrar el listado y para agregar a un nuevo empleado.
 * 
 * @returns {JSX.Element} Barra de herramientas interactiva para la gestión de personal.
 */
export function StaffToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  // Guardamos searchParams en un ref para leerlo dentro del efecto
  // sin convertirlo en dependencia reactiva (evita el bucle infinito).
  const searchParamsRef = useRef(searchParams);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current);
      if (searchTerm) {
        params.set('q', searchTerm);
      } else {
        params.delete('q');
      }
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, pathname, router]);

  return (
    <section className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-stack-md">
      <div className="w-full lg:w-1/2 relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
        <input
          className="w-full h-touch-target-min pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md text-on-surface outline-none transition-colors"
          placeholder="Buscar empleado por nombre, CC, email, teléfono..."
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-4 w-full lg:w-auto">
        <div className="relative flex-1 lg:flex-none">
          <select
            className="appearance-none cursor-pointer h-touch-target-min pl-10 pr-10 bg-surface-container-lowest border border-outline-variant text-on-surface font-cta text-cta rounded-lg hover:bg-surface-container transition-colors w-full outline-none focus:ring-1 focus:ring-primary-container"
            value={searchParams.get('role') || ''}
            onChange={(e) => {
              const val = e.target.value;
              const params = new URLSearchParams(searchParams);
              if (val) {
                params.set('role', val);
              } else {
                params.delete('role');
              }
              router.push(`${pathname}?${params.toString()}`);
            }}
          >
            <option value="">Filtrar por Rol</option>
            <option value="GERENTE">Gerente</option>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="TECNICO">Técnico</option>
          </select>
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">filter_list</span>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
        </div>
        <ExportExcelButton
          onClick={() => {
            // TODO: Implementar lógica de exportación a Excel próximamente.
            console.log('Exportar personal a Excel iniciado...');
          }}
        />
        <Link href="/personal/nuevo" className="cursor-pointer h-touch-target-min px-6 bg-primary-container text-[#000000] font-cta text-cta rounded-lg hover:bg-primary-fixed-dim transition-colors flex items-center gap-2 shadow-sm flex-1 lg:flex-none justify-center active:scale-[0.98]">
          <span className="material-symbols-outlined">add</span>
          Agregar Empleado
        </Link>
      </div>
    </section>
  );
}
