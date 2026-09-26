"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function ProveedoresPageClient({
  initialSuppliers,
  totalPages,
  currentPage,
  totalCount
}: {
  initialSuppliers: any[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
          <input
            type="text"
            placeholder="Buscar por nombre o NIT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container pl-12 pr-4 py-3 rounded-full border border-outline-variant focus:border-primary focus:outline-none transition-colors shadow-sm"
          />
          <button type="submit" className="hidden">Buscar</button>
        </form>
      </div>

      <div className="bg-surface-container rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-outline-variant">
                <th className="p-4 font-medium text-secondary">Proveedor</th>
                <th className="p-4 font-medium text-secondary">NIT</th>
                <th className="p-4 font-medium text-secondary">Teléfono</th>
                <th className="p-4 font-medium text-secondary">Email</th>
                <th className="p-4 font-medium text-secondary text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {initialSuppliers.length > 0 ? (
                initialSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary">domain</span>
                        <span className="font-medium text-on-surface">{supplier.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-body-md whitespace-nowrap text-secondary">
                      {supplier.nit}
                    </td>
                    <td className="p-4 text-body-md text-secondary">
                      {supplier.phone || '-'}
                    </td>
                    <td className="p-4 text-body-md text-secondary">
                      {supplier.email || '-'}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {}}
                        className="p-2 rounded-full hover:bg-surface-container-high text-secondary hover:text-primary transition-colors cursor-pointer"
                        title="Modificar Proveedor"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {}}
                        className="p-2 rounded-full bg-error/10 text-error hover:bg-error hover:text-white transition-colors cursor-pointer"
                        title="Eliminar Proveedor"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-secondary">
                    No se encontraron proveedores
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-secondary text-sm">
            Mostrando página {currentPage} de {totalPages} ({totalCount} resultados)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-full border border-outline-variant text-secondary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full border border-outline-variant text-secondary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
