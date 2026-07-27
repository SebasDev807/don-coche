'use client';

import Link from 'next/link';
import { ACTION_ICONS } from '@/constants/icons';
import { deleteService } from '@/actions/car_services';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui';
import { useSellingPrice } from '@/hooks';

const MySwal = withReactContent(Swal);

const getIconForCategory = (category: string | null | undefined) => {
  if (category === 'SERVITECA') return 'settings';
  if (category === 'LAVADERO') return 'local_car_wash';
  return 'car_repair';
};

export function ServiceCard({ service }: { service: any }) {
  const router = useRouter();

  const handleDelete = async () => {
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgba(221, 213, 51, 1)',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: { confirmButton: '!text-black' },
    });

    if (result.isConfirmed) {
      const res = await deleteService(service.id);
      if (res.success) {
        MySwal.fire('Eliminado!', res.message, 'success');
        router.refresh();
      } else {
        MySwal.fire('Error', res.message, 'error');
      }
    }
  };

  const { formattedSellingPrice } = useSellingPrice(service.basePrice, service.profitPercentage);

  return (
    <div 
      onClick={() => router.push(`/servicios/${service.id}`)}
      className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/50 hover:bg-surface-container-low transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full group relative overflow-hidden"
    >
      {/* Decorative gradient bar on the left */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Left: Icon and Name */}
      <div className="flex items-center gap-4 flex-grow min-w-0 pl-2">
        <div className="w-12 h-12 flex-shrink-0 bg-surface-container-highest text-on-surface rounded-xl flex items-center justify-center border border-outline-variant shadow-inner group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
          <span className="material-symbols-outlined text-[24px]">{getIconForCategory(service.category)}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className="font-headline-sm text-on-surface truncate group-hover:text-primary transition-colors" title={service.name}>
            {service.name}
          </h3>
          <span className="text-body-sm text-secondary bg-surface-container-high px-2.5 py-0.5 rounded-md inline-flex w-fit mt-1 border border-outline-variant/40 font-medium">
            {service.category === 'SERVITECA' ? 'Serviteca' : service.category === 'LAVADERO' ? 'Lavadero' : service.category || 'Sin Categoría'}
          </span>
        </div>
      </div>

      {/* Right: Details and Actions */}
      <div className="flex flex-wrap items-center gap-6 w-full md:w-auto mt-4 md:mt-0 pl-2 md:pl-0">
        
        <div className="flex flex-col min-w-[100px]">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">payments</span>
            Precio Base
          </span>
          <span className="font-body-lg text-on-surface font-medium">${Number(service.basePrice).toLocaleString('es-CO')}</span>
        </div>
        
        <div className="flex flex-col min-w-[80px]">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            Margen
          </span>
          <div className="flex items-center gap-1">
            <span className="font-body-lg text-tertiary font-bold bg-tertiary/10 px-2 py-0.5 rounded text-sm">
              {service.profitPercentage ? `${service.profitPercentage}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="flex flex-col min-w-[120px]">
          <span className="text-label-sm text-primary uppercase tracking-wider mb-1 font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">sell</span>
            PVP
          </span>
          <span className="font-title-lg text-primary font-black">{formattedSellingPrice}</span>
        </div>

        {/* Actions (stop propagation to prevent navigating when clicking buttons) */}
        <div className="flex items-center gap-2 border-l border-outline-variant/60 pl-6 ml-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/servicios/editar_servicio/${service.id}`}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer outline-none bg-surface text-on-surface-variant border border-outline-variant hover:bg-primary hover:text-on-primary hover:border-primary shadow-sm"
            title="Editar"
          >
            <span className="material-symbols-outlined text-[20px]">{ACTION_ICONS.edit}</span>
          </Link>
          <button
            onClick={handleDelete}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer outline-none bg-surface text-on-surface-variant border border-outline-variant hover:bg-error hover:text-on-error hover:border-error shadow-sm"
            title="Eliminar"
          >
            <span className="material-symbols-outlined text-[20px]">{ACTION_ICONS.delete}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
