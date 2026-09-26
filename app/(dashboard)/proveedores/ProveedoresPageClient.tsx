"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CreateSupplierModal } from "./CreateSupplierModal";
import { SearchBar } from "@/components/ui/SearchBar";
import { Pagination } from "@/components/ui/Pagination";
import { deleteSupplierAction } from "@/actions/suppliers/suppliers.actions";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

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

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleDelete = async (supplierId: string, supplierName: string) => {
    const result = await MySwal.fire({
      title: '¿Estás completamente seguro?',
      html: `Estás a punto de eliminar al proveedor <b>${supplierName}</b>.<br/><br/><span style="color: #dc3545; font-weight: bold;">¡ADVERTENCIA!</span> Esta acción es <b>irreversible</b> y también <b>eliminará TODAS las facturas de compra</b> asociadas a este proveedor para mantener la consistencia de la base de datos.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      MySwal.fire({
        title: 'Eliminando...',
        text: 'Por favor espera mientras se eliminan los datos.',
        allowOutsideClick: false,
        didOpen: () => {
          MySwal.showLoading();
        }
      });

      const response = await deleteSupplierAction(supplierId);

      if (response.success) {
        MySwal.fire(
          '¡Eliminado!',
          'El proveedor y sus facturas asociadas han sido eliminados correctamente.',
          'success'
        );
        router.refresh();
      } else {
        MySwal.fire(
          'Error',
          response.error || 'No se pudo eliminar el proveedor.',
          'error'
        );
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1 w-full max-w-md">
          <SearchBar 
            placeholder="Buscar por nombre o NIT..." 
            className="w-full"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary-fixed text-black px-6 py-3 rounded-full font-bold hover:brightness-95 transition-colors shadow-sm cursor-pointer w-full sm:w-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nuevo Proveedor
        </button>
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
                        onClick={() => handleDelete(supplier.id, supplier.name)}
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />

      <CreateSupplierModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </>
  );
}
