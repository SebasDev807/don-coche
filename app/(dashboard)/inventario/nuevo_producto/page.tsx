import { Metadata } from 'next';
import { CreateProductForm } from '@/components/dashboard/inventario/CreateProductForm';

export const metadata: Metadata = {
  title: 'Nuevo Producto | Don Coche',
  description: 'Formulario para registrar un nuevo producto en el inventario.',
};

/**
 * Server Component que renderiza la página para crear un nuevo producto.
 * Mantiene la página principal del lado del servidor.
 */
export default function NewProductPage() {
  return (
    <div className="fade-in max-w-7xl mx-auto flex flex-col gap-8">
      {/* ─── Page Header ─── */}
      <header className="mb-stack-lg max-w-4xl mx-auto w-full">
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">Agregar Nuevo Producto</h2>
        <p className="font-body-lg text-body-lg text-secondary">Complete la información para registrar un nuevo producto en el inventario.</p>
      </header>

      {/* ─── Form Section ─── */}
      <section className="w-full">
        <CreateProductForm />
      </section>
    </div>
  );
}
