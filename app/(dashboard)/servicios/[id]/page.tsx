import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServiceById } from '@/actions/car_services';
import { ACTION_ICONS } from '@/constants/icons';


export const metadata: Metadata = {
  title: 'Detalle del Servicio | Don Coche',
  description: 'Información detallada del servicio.',
};

export default async function ServiceDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const response = await getServiceById(id);

  if (!response.success || !response.data) {
    notFound();
  }

  const service = response.data;

  const basePrice = Number(service.basePrice);
  const profitPercentage = service.profitPercentage || 0;
  const sellingPrice = basePrice + (basePrice * profitPercentage) / 100;

  const formattedBasePrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(basePrice);
  const formattedSellingPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(sellingPrice);

  const getIconForCategory = (category: string | null | undefined) => {
    if (category === 'SERVITECA') return 'settings';
    if (category === 'LAVADERO') return 'local_car_wash';
    return 'car_repair';
  };

  return (
    <div className="fade-in flex flex-col min-h-[calc(100vh-140px)]">
      <main className="flex-grow flex flex-col max-w-[1000px] mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link href={`/servicios?tab=${(service.category || 'lavadero').toLowerCase()}`} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-label-lg">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Volver al Catálogo
          </Link>
        </div>

        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {/* Service Details */}
          <div className="w-full p-8 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-block bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-label-md font-bold mb-3 border border-primary/20">
                  {service.category === 'SERVITECA' ? 'Serviteca' : service.category === 'LAVADERO' ? 'Lavadero' : service.category || 'Sin Categoría'}
                </span>
                <h1 className="font-headline-lg text-on-surface leading-tight mb-2">
                  {service.name}
                </h1>
                <p className="text-body-lg text-secondary">
                  Ref: {service.id.split('-')[0].toUpperCase()}
                </p>
              </div>
              <Link
                href={`/servicios/editar_servicio/${service.id}`}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer outline-none bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary shadow-sm"
                title="Editar Servicio"
              >
                <span className="material-symbols-outlined text-[24px]">{ACTION_ICONS.edit}</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60">
              <div className="flex flex-col">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  Precio Base
                </span>
                <span className="font-title-md text-on-surface">{formattedBasePrice}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  Margen de Ganancia
                </span>
                <span className="font-title-md text-tertiary font-bold bg-tertiary/10 px-2 py-0.5 rounded w-fit">
                  {profitPercentage}%
                </span>
              </div>

              <div className="flex flex-col col-span-2 pt-4 border-t border-outline-variant/60 mt-2">
                <span className="text-label-sm text-primary uppercase tracking-wider mb-1 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">sell</span>
                  Precio al Público (PVP)
                </span>
                <span className="font-display-sm text-primary font-black">{formattedSellingPrice}</span>
              </div>
            </div>

            <div className="flex-grow">
              <h4 className="font-title-md text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">description</span>
                Descripción del Servicio
              </h4>
              <div className="bg-surface-container-low p-4 rounded-xl text-body-md text-on-surface-variant min-h-[100px] border border-outline-variant/40">
                {service.description ? (
                  <p>{service.description}</p>
                ) : (
                  <p className="italic opacity-60">No hay descripción disponible para este servicio.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
