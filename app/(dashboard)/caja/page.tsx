import { getPendingOrders, getTodayBilledOrders } from '@/actions/orders';
import { CajaDashboardClient } from '@/components/dashboard/caja/CajaDashboardClient';
import { verifyRole } from '@/lib/dal';

export const dynamic = 'force-dynamic';

export default async function CajaPage() {
  await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

  const [pendingRes, billedRes] = await Promise.all([
    getPendingOrders(),
    getTodayBilledOrders()
  ]);

  return (
    <div className="h-full bg-gray-50/50 p-6 fade-in">
      <CajaDashboardClient
        pendingOrders={pendingRes.data || []}
        billedOrders={billedRes.data || []}
      />
    </div>
  );
}
