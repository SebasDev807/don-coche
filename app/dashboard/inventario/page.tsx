import React from 'react';
import { InventoryHeader } from '@/components/dashboard/inventario/InventoryHeader';
import { InventoryKpiCards } from '@/components/dashboard/inventario/InventoryKpiCards';
import { InventoryTable } from '@/components/dashboard/inventario/InventoryTable';
import { getSeedProducts } from '@/lib/data/seed-inventory';
import { prisma } from '@/lib/prisma';

/**
 * Metadata de la página de Inventario para SEO y título.
 */
export const metadata = {
  title: 'Inventario Maestro | Don Coche',
  description: 'Control detallado de existencias y valoración de activos.',
};

/**
 * Server Component principal que representa la pantalla de Inventario (InventoryScreen).
 * Mantiene la lógica del servidor (obtención de datos desde la base de datos con fallback)
 * y renderiza los componentes atómicos correspondientes de la interfaz.
 * Utiliza la clase fade-in para una transición suave.
 * 
 * @returns {Promise<React.JSX.Element>} La página renderizada.
 */
export default async function InventoryScreenPage() {
  // Intentamos obtener los productos desde la base de datos
  let products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });

  // Si no hay productos en la base de datos, usamos los de seed como fallback
  if (products.length === 0) {
    products = getSeedProducts();
  }

  // Cálculos mock de KPIs (Normalmente vendrían del backend o calculados dinámicamente)
  const totalValue = products.reduce((acc, p) => acc + (Number(p.unitCost) * p.stock), 0);
  const totalProducts = products.length;
  const lowStockAlerts = products.filter(p => p.stock <= 10).length;
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
