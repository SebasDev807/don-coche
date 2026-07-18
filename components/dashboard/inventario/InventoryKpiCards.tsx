import React from 'react';

/**
 * Propiedades para el componente InventoryKpiCards.
 */
interface InventoryKpiCardsProps {
  totalValue: number;
  totalProducts: number;
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
  lowStockAlerts,
  leadingCategory
}: InventoryKpiCardsProps) {
  const formattedValue = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(totalValue);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg">
      <div className="glass-card rounded-xl p-6">
        <div className="font-body-md text-body-md text-on-surface-variant mb-2">Valor Total Bodega</div>
        <div className="font-headline-lg text-headline-lg text-on-surface">{formattedValue}</div>
      </div>
      <div className="glass-card rounded-xl p-6">
        <div className="font-body-md text-body-md text-on-surface-variant mb-2">Productos Totales</div>
        <div className="font-headline-lg text-headline-lg text-on-surface">{totalProducts} SKUs</div>
      </div>
      <div className="glass-card rounded-xl p-6">
        <div className="font-body-md text-body-md text-on-surface-variant mb-2">Alertas Stock Bajo</div>
        <div className="font-headline-lg text-headline-lg text-error">{lowStockAlerts}</div>
      </div>
      <div className="glass-card rounded-xl p-6 border-l-4 border-l-primary-container">
        <div className="font-body-md text-body-md text-on-surface-variant mb-2">Categoría Líder</div>
        <div className="font-headline-lg text-headline-lg text-on-surface">{leadingCategory}</div>
      </div>
    </div>
  );
}
