import React from 'react';

/**
 * Propiedades para el componente InventoryKpiCards.
 */
interface InventoryKpiCardsProps {
  totalValue: number;
  totalProducts: number;
  totalStockUnits?: number;
  lowStockAlerts: number;
  leadingCategory: string;
}

/**
 * Componente que muestra las tarjetas de indicadores clave (KPIs) para el inventario.
 * 
 * @param {InventoryKpiCardsProps} props - Los valores de los KPIs a mostrar.
 * @returns {React.JSX.Element} El componente InventoryKpiCards.
 */
export function InventoryKpiCards({
  totalValue,
  totalProducts,
  totalStockUnits = 0,
  lowStockAlerts,
  leadingCategory
}: InventoryKpiCardsProps) {
  const formattedValue = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(totalValue);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg">
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-highest flex items-center gap-4">
        <div className="w-12 h-12 shrink-0 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container">
          <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
        </div>
        <div className="truncate">
          <p className="font-label-bold text-label-bold text-secondary mb-1 truncate">Valor Bodega</p>
          <p className="font-headline-md text-headline-md text-on-surface truncate" title={formattedValue}>{formattedValue}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-highest flex items-center gap-4">
        <div className="w-12 h-12 shrink-0 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container">
          <span className="material-symbols-outlined text-2xl">inventory_2</span>
        </div>
        <div className="truncate flex flex-col justify-center">
          <p className="font-label-bold text-label-bold text-secondary mb-1 truncate">Productos Totales</p>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-on-surface leading-tight truncate">{totalProducts} SKUs</span>
            {totalStockUnits > 0 && (
              <span className="text-body-sm text-secondary truncate mt-1">{totalStockUnits.toLocaleString('es-CO')} ítems físicos</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-highest flex items-center gap-4">
        <div className="w-12 h-12 shrink-0 bg-red-100 rounded-full flex items-center justify-center text-red-800">
          <span className="material-symbols-outlined text-2xl">warning</span>
        </div>
        <div className="truncate">
          <p className="font-label-bold text-label-bold text-secondary mb-1 truncate">Alertas Stock</p>
          <p className={`font-headline-md text-headline-md ${lowStockAlerts > 0 ? 'text-error' : 'text-on-surface'} truncate`}>{lowStockAlerts}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-highest flex items-center gap-4">
        <div className="w-12 h-12 shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-800">
          <span className="material-symbols-outlined text-2xl">category</span>
        </div>
        <div className="truncate">
          <p className="font-label-bold text-label-bold text-secondary mb-1 truncate">Categoría Líder</p>
          <p className="font-headline-md text-headline-md text-on-surface truncate">{leadingCategory}</p>
        </div>
      </div>
    </section>
  );
}
