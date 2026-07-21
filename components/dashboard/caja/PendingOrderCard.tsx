import Link from 'next/link';

interface PendingOrderCardProps {
  order: any;
}

export function PendingOrderCard({ order }: PendingOrderCardProps) {
  // Calcular tiempo transcurrido
  const elapsedMinutes = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
  
  let timeColor = 'bg-green-100 text-green-800';
  if (elapsedMinutes > 30) timeColor = 'bg-yellow-100 text-yellow-800';
  if (elapsedMinutes > 60) timeColor = 'bg-red-100 text-red-800';

  return (
    <Link href={`/caja/${order.id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden">
        
        {/* Banner lateral decorativo */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 group-hover:w-2 transition-all"></div>

        <div className="flex justify-between items-start mb-3 pl-2">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">{order.vehicle.plate}</h3>
            <p className="font-body-sm text-surface-variant mt-1">Orden #{order.orderNumber}</p>
          </div>
          <span className={`text-xs font-label-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${timeColor}`}>
            <span className="material-symbols-outlined text-[14px]">timer</span>
            {elapsedMinutes} min
          </span>
        </div>

        <div className="mt-auto pt-4 border-t border-outline pl-2">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-surface-variant font-label-md uppercase mb-1">Atendido por</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-on-surface">person</span>
                </div>
                <p className="font-body-md text-on-surface font-bold">{order.technician.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-surface-variant font-label-md uppercase mb-1">Total Est.</p>
              <p className="font-headline-sm text-headline-sm text-primary">${order.grandTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
}
