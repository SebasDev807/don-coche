'use client';

import React, { useState } from 'react';
import { Product } from '@prisma/client';

/**
 * Propiedades del componente InventoryTable.
 */
interface InventoryTableProps {
  products: Product[];
}

/**
 * Componente que renderiza la tabla de inventario, controles superiores y paginación.
 * 
 * @param {InventoryTableProps} props - Propiedades que incluyen la lista de productos a mostrar.
 * @returns {React.JSX.Element} El componente InventoryTable.
 */
export function InventoryTable({ products }: InventoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
  const paginatedProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="glass-card rounded-xl overflow-hidden flex flex-col">
      {/* Controles de la Tabla */}
      <div className="p-4 border-b border-surface-container-highest flex justify-between items-center bg-surface-bright">
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded border border-outline-variant font-label-bold text-label-bold text-on-surface bg-surface hover:bg-surface-container-low transition-colors cursor-pointer">
            Todas las Categorías
          </button>
          <button className="px-4 py-2 rounded border border-outline-variant font-label-bold text-label-bold text-on-surface bg-surface hover:bg-surface-container-low transition-colors cursor-pointer">
            Estado de Stock
          </button>
        </div>
        <div className="font-body-md text-body-md text-on-surface-variant">
          Mostrando {products.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-{Math.min(currentPage * itemsPerPage, products.length)} de {products.length} productos
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-surface-container-low border-b border-surface-container-highest">
            <tr>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">SKU / CÓDIGO</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">DESCRIPCIÓN</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">CATEGORÍA</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">COSTO UNIT.</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">PRECIO VENTA</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">STOCK</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">VALOR TOTAL</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md divide-y divide-surface-container-highest">
            {paginatedProducts.map((product) => {
              const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
              const totalValue = Number(product.unitCost) * product.stock;

              return (
                <tr key={product.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="p-4 text-on-surface-variant font-mono text-sm">{product.code}</td>
                  <td className="p-4">
                    <div className="font-semibold text-on-surface truncate max-w-[250px]" title={product.name}>{product.name}</div>
                    {product.brand && <div className="text-xs text-on-surface-variant mt-1 font-medium">Marca: {product.brand}</div>}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant text-xs rounded font-label-bold">
                      {product.category}
                    </span>
                  </td>
                  <td className="p-4 text-on-surface">{formatCurrency(Number(product.unitCost))}</td>
                  <td className="p-4 text-on-surface font-semibold">{formatCurrency(Number(product.salePrice))}</td>
                  <td className="p-4 text-center">
                    <div className={`font-bold ${product.stock <= 10 ? 'text-error' : 'text-on-surface'}`}>{product.stock}</div>
                    {product.stock <= 10 ? (
                      <div className="text-[10px] uppercase font-bold text-error flex items-center justify-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[12px]">warning</span>
                        Stock Bajo
                      </div>
                    ) : (
                      <div className="text-[10px] uppercase font-bold text-[#2e7d32] mt-1">Suficiente</div>
                    )}
                  </td>
                  <td className="p-4 font-bold text-on-surface">{formatCurrency(totalValue)}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container transition-colors cursor-pointer" title="Editar">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-surface-container transition-colors cursor-pointer" title="Eliminar">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-on-surface-variant">
                  No hay productos en el inventario.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer y Paginación */}
      {products.length > 0 && (
        <div className="p-4 border-t border-surface-container-highest flex justify-between items-center bg-surface-bright">
          <p className="text-sm text-on-surface-variant">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
