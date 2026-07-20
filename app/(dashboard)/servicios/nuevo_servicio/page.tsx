import { CreateServiceForm } from '@/components/dashboard/servicios/CreateServiceForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nuevo Servicio | Don Coche',
  description: 'Agregar un nuevo servicio al catálogo',
};

export default function NuevoServicioPage() {
  return (
    <div className="fade-in max-w-7xl mx-auto flex flex-col gap-8">
      {/* ─── Page Header ─── */}
      <header className="mb-stack-lg max-w-4xl mx-auto w-full">
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">Agregar Nuevo Servicio</h2>
        <p className="font-body-lg text-body-lg text-secondary">Complete la información para registrar un nuevo servicio en el catálogo.</p>
      </header>

      {/* ─── Form Section ─── */}
      <section className="w-full">
        <CreateServiceForm />
      </section>
    </div>
  );
}
