import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EditProductForm } from '@/components';

export const metadata: Metadata = {
  title: 'Editar Producto | Don Coche',
  description: 'Formulario para actualizar los datos de un producto.',
};

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage(props: EditProductPageProps) {
  // ─── Resolve Route Parameters ───
  const params = await props.params;
  const { id } = params;

  // ─── Retrieve Product from Database ───
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  // Convert Decimals to Number for the client component
  const serializedProduct = {
    ...product,
    unitCost: Number(product.unitCost),
    salePrice: Number(product.salePrice),
  };

  return (
    <div className="fade-in max-w-7xl mx-auto flex flex-col gap-8">
      {/* ─── Page Header ─── */}
      <header className="mb-stack-lg max-w-4xl mx-auto w-full">
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">Editar Producto</h2>
        <p className="font-body-lg text-body-lg text-secondary">Actualice la información del producto.</p>
      </header>

      {/* ─── Form Section ─── */}
      <section className="w-full">
        <EditProductForm product={serializedProduct as any} />
      </section>
    </div>
  );
}
