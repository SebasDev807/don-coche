'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ExportExcelButton, PrimaryButton, SearchBar } from '@/components/ui';

export function StaffToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <section className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-stack-md">
      <SearchBar 
        className="w-full lg:w-1/2" 
        placeholder="Buscar empleado por nombre, CC, email, teléfono..."
      />
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
              router.push(`${pathname}?${params.toString()}`, { scroll: false });
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
        <PrimaryButton href="/personal/nuevo" className="flex-1 lg:flex-none">
          <span className="material-symbols-outlined">add</span>
          Agregar Empleado
        </PrimaryButton>
      </div>
    </section>
  );
}
