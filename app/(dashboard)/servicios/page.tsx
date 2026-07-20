import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catálogo de Servicios | Don Coche',
  description: 'Gestione los servicios, precios y márgenes de ganancia.',
};

export default function CatalogServicePage() {
  return (
    <div className="fade-in">
      <main className="flex-grow p-margin-mobile md:p-margin-desktop max-w-[1440px] mx-auto w-full">
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
          <button className="bg-primary-container hover:bg-primary-fixed text-on-surface font-cta text-cta py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
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
          </button>
        </header>

        {/* Tabs and Cards will go here later */}
      </main>
    </div>
  );
}
