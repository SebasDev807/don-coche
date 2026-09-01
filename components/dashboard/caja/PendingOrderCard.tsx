'use client';

import Link from 'next/link';
import Swal from 'sweetalert2';
import { cancelOrder } from '@/actions/orders';
import { useRouter } from 'next/navigation';

interface PendingOrderCardProps {
  order: any;
}

function formatElapsedTime(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  if (totalMinutes < 1440) {
    const hours = Math.floor(totalMinutes / 60);
    return `${hours} h`;
  }
  if (totalMinutes < 43200) {
    const days = Math.floor(totalMinutes / 1440);
    return `${days} ${days === 1 ? 'día' : 'días'}`;
  }
  if (totalMinutes < 525600) {
    const months = Math.floor(totalMinutes / 43200);
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
  const years = Math.floor(totalMinutes / 525600);
  return `${years} ${years === 1 ? 'año' : 'años'}`;
}

export function PendingOrderCard({ order }: PendingOrderCardProps) {
  const router = useRouter();

  // Calcular tiempo transcurrido
  const elapsedMinutes = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
  
  let timeColor = 'bg-green-100 text-green-800';
  let isRed = false;
  if (elapsedMinutes > 30) timeColor = 'bg-yellow-100 text-yellow-800';
  if (elapsedMinutes > 60) {
    timeColor = 'bg-red-100 text-red-800';
    isRed = true;
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the order detail
    e.stopPropagation();

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará esta orden por exceder el tiempo de espera.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const res = await cancelOrder(order.id);
      if (res.success) {
        Swal.fire('¡Eliminada!', 'La orden ha sido eliminada.', 'success');
        router.refresh(); // Refresh the page to remove the order
      } else {
        Swal.fire('Error', res.message || 'No se pudo eliminar la orden.', 'error');
      }
    }
  };

  return (
    <Link href={`/caja/${order.id}`}>
      <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-5 hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden">
        
        {/* Banner lateral decorativo */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:w-2 transition-all"></div>

        <div className="flex justify-between items-start mb-3 pl-2">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">{order.vehicle.plate}</h3>
            <p className="font-body-sm text-on-surface-variant mt-1">Orden #{order.orderNumber}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-label-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${timeColor}`}>
              <span className="material-symbols-outlined text-[14px]">timer</span>
              {formatElapsedTime(elapsedMinutes)}
            </span>
            {isRed && (
              <button
                onClick={handleDelete}
                className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded border border-red-200 transition-colors flex items-center gap-1 z-10 cursor-pointer"
                title="Eliminar orden por exceder tiempo límite"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                Eliminar
              </button>
            )}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-outline-variant pl-2">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-on-surface-variant font-label-md uppercase mb-1">Atendido por</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-on-surface">person</span>
                </div>
                <p className="font-body-md text-on-surface font-bold">{order.technician.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-on-surface-variant font-label-md uppercase mb-1">Total Est.</p>
              <p className="font-headline-sm text-headline-sm text-primary">
                ${((order.totalServices + order.totalProducts) * 1.19).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
}
