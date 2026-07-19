import React, { Suspense } from 'react';
import { InventoryKpiCards } from '@/components/dashboard/inventario/InventoryKpiCards';
import { InventoryTable } from '@/components/dashboard/inventario/InventoryTable';
import { InventoryToolbar } from '@/components/dashboard/inventario/InventoryToolbar';
import { getSeedProducts } from '@/lib/data/seed-inventory';
import { prisma } from '@/lib/prisma';
import { ItemCategory } from '@prisma/client';

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
export default async function InventoryScreenPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;

  // Intentamos obtener los productos desde la base de datos
  let products = await prisma.product.findMany({
    where: { 
      isActive: true,
      ...(category && { category: category as ItemCategory }),
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
        ]
      })
    },
    orderBy: { code: 'asc' },
  });

  // Si no hay productos en la base de datos (y no hay filtros), usamos los de seed como fallback
  if (products.length === 0 && !query && !category) {
    products = getSeedProducts();
  }

  // Cálculos mock de KPIs (Normalmente vendrían del backend o calculados dinámicamente)
  const totalValue = products.reduce((acc, p) => acc + (Number(p.unitCost) * p.stock), 0);
  const totalProducts = products.length;
  const lowStockAlerts = products.filter(p => p.stock <= 10).length;
  const leadingCategory = 'Lubricantes';

  // Serializar objetos Decimal y Date para enviarlos al Client Component
  const serializedProducts = products.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    brand: p.brand,
    category: p.category,
    stock: p.stock,
    unitCost: Number(p.unitCost),
    salePrice: Number(p.salePrice)
  }));

  return (
    <div className="fade-in">
      <main className="flex-grow p-margin-mobile md:p-margin-desktop max-w-[1440px] mx-auto w-full">
        {/* Encabezado Principal */}
        <header className="mb-stack-lg">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Inventario Maestro</h1>
          <p className="font-body-lg text-body-lg text-secondary">Control detallado de existencias y valoración de activos.</p>
        </header>

        {/* Tarjetas de Indicadores (KPIs) */}
        <InventoryKpiCards 
          totalValue={totalValue}
          totalProducts={totalProducts}
          lowStockAlerts={lowStockAlerts}
          leadingCategory={leadingCategory}
        />

        {/* Barra de Búsqueda y Filtros */}
        <Suspense fallback={<div className="h-touch-target-min w-full bg-surface-container-lowest border border-outline-variant rounded-lg animate-pulse mb-stack-md" />}>
          <InventoryToolbar />
        </Suspense>

        {/* Contenedor Principal de la Tabla */}
        <InventoryTable products={serializedProducts} />
      </main>
    </div>
  );
}
