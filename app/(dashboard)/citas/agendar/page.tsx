import { Metadata } from 'next';
import Link from 'next/link';
import { CreateAppointmentForm } from '@/components/dashboard/citas';

export const metadata: Metadata = {
  title: 'Agendar Cita | Don Coche',
  description: 'Agende una nueva cita para un cliente existente.',
};

/**
 * Página de agendamiento de citas (Server Component).
 *
 * Renderiza el formulario de creación de citas con búsqueda de cliente,
 * selección de vehículo y selector visual de fecha/hora.
 *
 * @returns {Promise<JSX.Element>} La página de agendamiento.
 */
export default async function AgendarCitaPage() {
  return (
    <div className="fade-in">
      <main className="flex-grow max-w-[1440px] mx-auto w-full">
        {/* Header con breadcrumb */}
        <header className="mb-stack-lg">
          <Link
            href="/citas"
            className="inline-flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors mb-3 group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            Volver a Próximas Citas
          </Link>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            Agendar Nueva Cita
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">
            Busque un cliente existente, seleccione su vehículo y elija una fecha y hora disponible.
          </p>
        </header>

        {/* Form */}
        <CreateAppointmentForm />
      </main>
    </div>
  );
}
