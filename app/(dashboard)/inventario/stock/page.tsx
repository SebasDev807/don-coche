import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { BatchStockUpdate } from '@/components';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Actualización Rápida de Stock | Don Coche',
  description: 'Ingreso rápido de mercancía usando escáner de código de barras.',
};

export default async function StockUpdatePage() {
  // Obtener el catálogo mínimo necesario para la búsqueda rápida
  // Se filtran los inactivos si es necesario
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      barCode: true,
      stock: true,
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="fade-in flex flex-col min-h-[calc(100vh-140px)] max-w-[1200px] mx-auto w-full">
      {/* Navigation Breadcrumb */}
      <div className="mb-6">
        <Link href={`/inventario`} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-label-lg">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Volver al Inventario
        </Link>
      </div>

      <header className="mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">
          Ingreso de Mercancía
        </h1>
        <p className="font-body-lg text-body-lg text-secondary">
          Escanea los códigos de barras de los productos que acaban de llegar para aumentar su stock rápidamente.
        </p>
      </header>

      <section className="w-full">
        <BatchStockUpdate catalog={products} />
      </section>
    </div>
  );
}
