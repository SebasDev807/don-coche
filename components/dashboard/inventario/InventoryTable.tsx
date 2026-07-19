'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface InventoryProduct {
  id: string;
  code: string | null;
  name: string;
  brand: string | null;
  category: string;
  stock: number;
  unitCost: number;
  salePrice: number;
}

/**
 * Propiedades del componente InventoryTable.
 */
interface InventoryTableProps {
  products: InventoryProduct[];
}

/**
 * Componente que renderiza la tabla de inventario y paginación.
 * 
 * @param {InventoryTableProps} props - Propiedades que incluyen la lista de productos a mostrar.
 * @returns {React.JSX.Element} El componente InventoryTable.
 */
export function InventoryTable({ products }: InventoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
  const paginatedProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(val);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-highest overflow-hidden">
      {/* Contenedor de la Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface-container border-b border-outline-variant">
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">SKU / CÓDIGO</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">DESCRIPCIÓN</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">CATEGORÍA</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">COSTO UNIT.</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">PRECIO VENTA</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">STOCK</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant font-body-md text-on-surface">
            {paginatedProducts.map((product) => {
              return (
                <tr key={product.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                  <td className="py-4 px-6 text-secondary font-mono text-sm">{product.code}</td>
                  <td className="py-4 px-6">
                    <div className="font-medium truncate max-w-[250px]" title={product.name}>{product.name}</div>
                    {product.brand && <div className="text-xs text-secondary mt-0.5">Marca: {product.brand}</div>}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                      {product.category.charAt(0).toUpperCase() + product.category.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-secondary">{formatCurrency(product.unitCost)}</td>
                  <td className="py-4 px-6 font-semibold">{formatCurrency(product.salePrice)}</td>
                  <td className="py-4 px-6 text-center">
                    <div className={`font-bold ${product.stock <= 10 ? 'text-red-600' : 'text-on-surface'}`}>{product.stock}</div>
                    {product.stock <= 10 ? (
                      <div className="text-[10px] uppercase font-bold text-red-600 flex items-center justify-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[12px]">warning</span>
                        Stock Bajo
                      </div>
                    ) : (
                      <div className="text-[10px] uppercase font-bold text-green-700 mt-1">Suficiente</div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="cursor-pointer text-secondary hover:text-primary p-2 rounded-full hover:bg-surface-container transition-colors" title="Editar">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button className="cursor-pointer text-secondary hover:text-error p-2 rounded-full hover:bg-surface-container transition-colors" title="Eliminar">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-secondary">
                  No hay productos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer y Paginación */}
      {products.length > 0 && (
        <div className="bg-surface border-t border-outline-variant p-4 flex items-center justify-between">
          <p className="text-sm text-secondary">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, products.length)} de {products.length} productos
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="cursor-pointer p-2 border border-outline-variant rounded hover:bg-surface-container text-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="cursor-pointer p-2 border border-outline-variant rounded hover:bg-surface-container text-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
