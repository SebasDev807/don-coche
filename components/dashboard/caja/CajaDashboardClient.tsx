'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PendingOrderCard } from './PendingOrderCard';
import { DailyCashSummary } from './DailyCashSummary';

interface CajaDashboardClientProps {
  pendingOrders: any[];
  billedOrders: any[];
}

export function CajaDashboardClient({ pendingOrders, billedOrders }: CajaDashboardClientProps) {
  const router = useRouter();

  // Polling cada 15 segundos para buscar nuevas órdenes en pista
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      
      {/* Columna Izquierda: Órdenes en Pista */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Órdenes en Pista</h1>
          <p className="text-gray-500 mt-1">Vehículos que están siendo atendidos o esperando cobro.</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-6">
          {pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white border border-dashed border-gray-300 rounded-xl">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">done_all</span>
              <p className="text-gray-500 font-medium">No hay vehículos en pista.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingOrders.map(order => (
                <PendingOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Cuadre del Día */}
      <div className="w-full lg:w-96 flex-shrink-0 h-[600px] lg:h-auto pb-6 lg:pb-0">
        <DailyCashSummary orders={billedOrders} />
      </div>

    </div>
  );
}
