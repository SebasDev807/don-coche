'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ExportExcelButton, PrimaryButton, SearchBar } from '@/components/ui';
import { getCategories } from '@/actions/inventory';

export function InventoryToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);

  const fetchCats = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  useEffect(() => {
    fetchCats();
  }, []);

  return (
    <section className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-stack-md">
      <SearchBar 
        className="w-full lg:w-1/2" 
        placeholder="Buscar producto por SKU, nombre, marca..."
      />
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
              router.push(`${pathname}?${params.toString()}`, { scroll: false });
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
        <PrimaryButton href="/inventario/nuevo_producto" className="flex-1 lg:flex-none">
          <span className="material-symbols-outlined">add</span>
          Agregar Producto
        </PrimaryButton>
      </div>

    </section>
  );
}
