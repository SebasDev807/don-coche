import { Suspense } from 'react';
import { InventoryKpiCards } from '@/components/dashboard/inventario/InventoryKpiCards';
import { InventoryTable } from '@/components/dashboard/inventario/InventoryTable';
import { InventoryToolbar } from '@/components/dashboard/inventario/InventoryToolbar';
import { getSeedProducts } from '@/lib/data/seed-inventory';
import { prisma } from '@/lib/prisma';
import { PrimaryButton } from '@/components/ui';


/**
 * Metadata de la página de Inventario para SEO y título.
 */
export const revalidate = 60;


export const metadata = {
  title: 'Inventario | Don Coche',
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
    include: {
      category_rel: true
    },
    where: {
      isActive: true,
      ...(category && { categoryId: category }),
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { barCode: { contains: query, mode: 'insensitive' } },
        ]
      })
    },
    orderBy: { barCode: 'asc' },
  });

  // Si no hay productos en la base de datos (y no hay filtros), usamos los de seed como fallback
  if (products.length === 0 && !query && !category) {
    products = getSeedProducts() as any;
  }

  // Cálculos mock de KPIs (Normalmente vendrían del backend o calculados dinámicamente)
  const totalValue = products.reduce((acc, p) => acc + (Number(p.unitCost) * p.stock), 0);
  const totalProducts = products.length;
  const lowStockAlerts = products.filter(p => p.stock <= 10).length;
  const leadingCategory = 'Lubricantes';

  // Serializar objetos Decimal y Date para enviarlos al Client Component
  const serializedProducts = products.map((p) => ({
    id: p.id,
    barCode: p.barCode,
    name: p.name,
    description: p.description,
    category: p.category_rel?.name || p.category || 'Sin Categoría',
    categoryId: p.categoryId,
    stock: p.stock,
    unitCost: Number(p.unitCost),
    salePrice: Number(p.salePrice),
    profitPercentage: p.profitPercentage ? Number(p.profitPercentage) : 0
  }));

  // Ordenar los productos para mostrar primero los de stock bajo (<= 10)
  serializedProducts.sort((a, b) => {
    const aLowStock = a.stock <= 10;
    const bLowStock = b.stock <= 10;

    if (aLowStock && !bLowStock) return -1;
    if (!aLowStock && bLowStock) return 1;

    // Si ambos son bajo stock o ambos normal, ordenar por código
    return (a.barCode || '').localeCompare(b.barCode || '');
  });

  return (
    <div className="fade-in">
      <main className="flex-grow max-w-[1440px] mx-auto w-full">
        {/* Encabezado Principal */}
        <header className="mb-stack-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Inventario Maestro</h1>
            <p className="font-body-lg text-body-lg text-secondary">Control detallado de existencias y valoración de activos.</p>
          </div>
          <PrimaryButton href="/inventario/stock" className="bg-tertiary-container text-on-tertiary-container hover:bg-tertiary-container/80 !text-tertiary">
            <span className="material-symbols-outlined">barcode_scanner</span>
            Actualización Rápida
          </PrimaryButton>
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
