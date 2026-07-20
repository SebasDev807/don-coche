import { Metadata } from 'next';
import Link from 'next/link';
import { PrimaryButton, SearchBar } from '@/components/ui';
import { getServices } from '@/actions/car_services';
import { ServiceCard } from '@/components/dashboard/servicios/ServiceCard';

export const metadata: Metadata = {
  title: 'Catálogo de Servicios | Don Coche',
  description: 'Gestione los servicios, precios y márgenes de ganancia.',
};

export default async function CatalogServicePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const currentTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'lavadero';
  const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const { data: services, pagination } = await getServices({ page, limit: 8, category: currentTab, query });

  return (
    <div className="fade-in flex flex-col min-h-[calc(100vh-140px)]">
      <main className="flex-grow flex flex-col max-w-[1440px] mx-auto w-full">
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

        {/* Tabs Section */}
        <div className="flex items-center gap-8 border-b border-outline-variant/60 mb-6">
          <Link
            href="/servicios?tab=lavadero"
            className={`pb-3 font-label-bold text-label-bold transition-colors relative ${currentTab === 'lavadero' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Servicios Lavadero
            {currentTab === 'lavadero' && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-secondary rounded-t-sm" />
            )}
          </Link>
          <Link
            href="/servicios?tab=serviteca"
            className={`pb-3 font-label-bold text-label-bold transition-colors relative ${currentTab === 'serviteca' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Servicios Serviteca
            {currentTab === 'serviteca' && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-secondary rounded-t-sm" />
            )}
          </Link>
        </div>

        <div className="mb-6">
          <SearchBar className="w-full sm:w-1/2 lg:w-1/3" placeholder="Buscar servicio..." />
        </div>

        {/* Listado de Servicios */}
        {services && services.length > 0 ? (
          <div className="flex flex-col flex-grow">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 content-start flex-grow">
              {services.map((service: any) => (
                <ServiceCard 
                  key={service.id} 
                  service={{
                    id: service.id,
                    name: service.name,
                    icon: service.icon,
                    category: service.category,
                    basePrice: service.basePrice,
                    description: service.description,
                    isActive: service.isActive
                  }} 
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-auto pt-8 pb-4">
                <Link
                  href={`/servicios?tab=${currentTab}&page=${page - 1}`}
                  className={`px-4 py-2 border border-outline-variant rounded-lg text-on-surface ${page <= 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-surface-container-high'} transition-colors`}
                >
                  Anterior
                </Link>
                <span className="text-secondary font-label-lg">
                  Página {page} de {pagination.totalPages}
                </span>
                <Link
                  href={`/servicios?tab=${currentTab}&page=${page + 1}`}
                  className={`px-4 py-2 border border-outline-variant rounded-lg text-on-surface ${page >= pagination.totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-surface-container-high'} transition-colors`}
                >
                  Siguiente
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface border border-outline-variant rounded-xl mt-6">
            <span className="material-symbols-outlined text-[48px] text-secondary mb-4">
              car_repair
            </span>
            <h3 className="text-headline-sm text-on-surface mb-2">No hay servicios registrados</h3>
            <p className="text-secondary mb-6">Comienza agregando un nuevo servicio a tu catálogo.</p>
          </div>
        )}
      </main>
    </div>
  );
}
