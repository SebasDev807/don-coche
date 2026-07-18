import React from 'react';
import { InventoryHeader } from '@/components/dashboard/inventario/InventoryHeader';
import { InventoryKpiCards } from '@/components/dashboard/inventario/InventoryKpiCards';
import { InventoryTable } from '@/components/dashboard/inventario/InventoryTable';
import { getSeedProducts } from '@/lib/data/seed-inventory';

/**
 * Metadata de la página de Inventario para SEO y título.
 */
export const metadata = {
  title: 'Inventario Maestro | Don Coche',
  description: 'Control detallado de existencias y valoración de activos.',
};

/**
 * Server Component principal que representa la pantalla de Inventario (InventoryScreen).
 * Mantiene la lógica del servidor (obtención de mock data en este caso) y renderiza 
 * los componentes atómicos correspondientes de la interfaz.
 * Utiliza la clase fade-in para una transición suave.
 * 
 * @returns {Promise<React.JSX.Element>} La página renderizada.
 */
export default async function InventoryScreenPage() {
  // Simulamos la obtención de 10 productos desde la base de datos
  const products = getSeedProducts();

  // Cálculos mock de KPIs (Normalmente vendrían del backend)
  const totalValue = 42500000;
  const totalProducts = 842;
  const lowStockAlerts = 12;
  const leadingCategory = 'Lubricantes';

  return (
    <div className="fade-in">
      <main className="flex-grow p-margin-mobile md:p-margin-desktop max-w-[1440px] mx-auto w-full">
        {/* Encabezado Principal */}
        <InventoryHeader />

        {/* Tarjetas de Indicadores (KPIs) */}
        <InventoryKpiCards 
          totalValue={totalValue}
          totalProducts={totalProducts}
          lowStockAlerts={lowStockAlerts}
          leadingCategory={leadingCategory}
        />

        {/* Contenedor Principal de la Tabla */}
        <InventoryTable products={products} />
      </main>
    </div>
  );
}
