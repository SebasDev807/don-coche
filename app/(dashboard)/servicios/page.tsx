import { Metadata } from 'next';
import { PrimaryButton } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Catálogo de Servicios | Don Coche',
  description: 'Gestione los servicios, precios y márgenes de ganancia.',
};

/**
 * Página principal del catálogo de servicios (Server Component).
 * 
 * Renderiza la interfaz de usuario para gestionar los servicios ofrecidos,
 * permitiendo configurar sus precios y márgenes de ganancia. 
 * Actualmente muestra el encabezado y las acciones principales como la creación de nuevos servicios.
 * 
 * @returns {JSX.Element} La estructura principal de la página del catálogo de servicios.
 */
export default function CatalogServicePage() {
  return (
    <div className="fade-in">
      <main className="flex-grow max-w-[1440px] mx-auto w-full">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-stack-lg gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
              Catálogo de Servicios
            </h1>
            <p className="font-body-lg text-body-lg text-secondary">
              Gestione los servicios, precios y márgenes de ganancia.
            </p>
          </div>
          <PrimaryButton href="/servicios/nuevo_servicio">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="w-5 h-5"
            >
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            Agregar Nuevo Servicio
          </PrimaryButton>
        </header>

        {/* Tabs and Cards will go here later */}
      </main>
    </div>
  );
}
