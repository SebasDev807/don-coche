import { Metadata } from 'next';
import { CreateStaffForm } from '@/components/dashboard/personal';

export const metadata: Metadata = {
  title: 'Nuevo Empleado | Don Coche',
  description: 'Formulario para registrar un nuevo integrante al sistema.',
};

export default function NewStaffPage() {
  return (
    <div className="fade-in max-w-7xl mx-auto flex flex-col gap-8">
      {/* ─── Page Header ─── */}
      <header className="mb-stack-lg max-w-4xl mx-auto w-full">
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">Agregar Nuevo Empleado</h2>
        <p className="font-body-lg text-body-lg text-secondary">Complete la información para registrar un nuevo integrante al sistema.</p>
      </header>

      {/* ─── Form Section ─── */}
      <section className="w-full">
        <CreateStaffForm />
      </section>
    </div>
  );
}
