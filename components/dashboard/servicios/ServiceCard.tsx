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
    <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative">
      {/* Top Section */}
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-surface-container-high text-on-surface-variant rounded-lg flex items-center justify-center border border-outline-variant/50">
          <span className="material-symbols-outlined text-[24px]">{getIconForCategory(service.category)}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/servicios/editar_servicio/${service.id}`}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary bg-primary-container text-on-primary-container"
            title="Editar"
          >
            <span className="material-symbols-outlined text-[18px]">{ACTION_ICONS.edit}</span>
          </Link>
          <button
            onClick={handleDelete}
            className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-error"
            title="Eliminar"
          >
            <span className="material-symbols-outlined text-[18px]">{ACTION_ICONS.delete}</span>
          </button>
        </div>
      </div>

      {/* Body Section */}
      <div className="flex-grow space-y-4">
        <div>
          <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Nombre del Servicio</label>
          <div className="h-11 w-full rounded-lg border border-outline-variant/60 bg-surface px-3 flex items-center text-on-surface shadow-sm">
            {service.name}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Precio (PVP)</label>
            <div className="h-11 w-full rounded-lg border border-outline-variant/60 bg-surface px-3 flex items-center text-on-surface shadow-sm">
              {formattedSellingPrice}
            </div>
          </div>
          <div>
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Categoría</label>
            <div className="h-11 w-full rounded-lg border border-outline-variant/60 bg-surface px-3 flex items-center text-on-surface shadow-sm truncate">
              {service.category || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
