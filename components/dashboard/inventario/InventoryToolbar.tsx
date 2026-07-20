'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ExportExcelButton } from '@/components/ui';
import { getCategories } from '@/actions/inventory';

/**
 * Componente que renderiza la barra de herramientas (Toolbar) de la sección inventario.
 * 
 * Contiene el campo de búsqueda por coincidencia parcial y los botones de acción para
 * filtrar el inventario por categoría y para agregar un nuevo producto.
 * 
 * @returns {JSX.Element} Barra de herramientas interactiva para la gestión de inventario.
 */
export function InventoryToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);

  // Guardamos searchParams en un ref para leerlo dentro del efecto
  // sin convertirlo en dependencia reactiva (evita el bucle infinito).
  const searchParamsRef = useRef(searchParams);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const fetchCats = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  useEffect(() => {
    fetchCats();
  }, []);

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
          placeholder="Buscar producto por SKU, nombre, marca..."
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-4 w-full lg:w-auto">
        <div className="relative flex-1 lg:flex-none">
          <select
            className="appearance-none cursor-pointer h-touch-target-min pl-10 pr-10 bg-surface-container-lowest border border-outline-variant text-on-surface font-cta text-cta rounded-lg hover:bg-surface-container transition-colors w-full outline-none focus:ring-1 focus:ring-primary-container"
            value={searchParams.get('category') || ''}
            onChange={(e) => {
              const val = e.target.value;
              const params = new URLSearchParams(searchParams);
              if (val) {
                params.set('category', val);
              } else {
                params.delete('category');
              }
              router.push(`${pathname}?${params.toString()}`);
            }}
          >
            <option value="">Filtrar por Categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">filter_list</span>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
        </div>
        <ExportExcelButton
          onClick={() => {
            console.log('Exportar inventario a Excel iniciado...');
          }}
        />
        <Link href="/inventario/nuevo_producto" className="cursor-pointer h-touch-target-min px-6 bg-primary-container text-[#000000] font-cta text-cta rounded-lg hover:bg-primary-fixed-dim transition-colors flex items-center gap-2 shadow-sm flex-1 lg:flex-none justify-center active:scale-[0.98] whitespace-nowrap">
          <span className="material-symbols-outlined">add</span>
          Agregar Producto
        </Link>
      </div>

    </section>
  );
}
