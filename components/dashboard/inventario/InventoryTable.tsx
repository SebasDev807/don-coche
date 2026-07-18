import React from 'react';
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
          Mostrando 1-{Math.min(15, products.length)} de 842 productos
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low border-b border-surface-container-highest">
            <tr>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">SKU / CÓDIGO</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">DESCRIPCIÓN</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">CATEGORÍA</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">COSTO UNIT.</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">PRECIO VENTA</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">STOCK</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase">VALOR TOTAL</th>
              <th className="p-4 font-label-bold text-label-bold text-on-surface-variant uppercase text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md divide-y divide-surface-container-highest">
            {products.map((product) => {
              const [mainName, subtitle] = product.name.split(' - ');
              const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
              const totalValue = Number(product.unitCost) * product.stock;

              return (
                <tr key={product.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="p-4 text-on-surface-variant font-mono text-sm">{product.code}</td>
                  <td className="p-4">
                    <div className="font-semibold text-on-surface">{mainName}</div>
                    {subtitle && <div className="text-xs text-on-surface-variant mt-1">{subtitle}</div>}
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
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button className="text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="p-4 border-t border-surface-container-highest flex justify-between items-center bg-surface-bright">
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50 cursor-pointer" disabled>
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded bg-inverse-surface text-inverse-on-surface font-label-bold text-sm cursor-pointer">1</button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors font-label-bold text-sm cursor-pointer">2</button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors font-label-bold text-sm cursor-pointer">3</button>
          <span className="w-8 h-8 flex items-center justify-center text-on-surface-variant">...</span>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors font-label-bold text-sm cursor-pointer">56</button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
        <div className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
          <span>Filas por página:</span>
          <select className="border border-outline-variant rounded p-1 text-sm bg-surface cursor-pointer">
            <option>10</option>
            <option>30</option>
            <option>50</option>
          </select>
        </div>
      </div>
    </div>
  );
}
