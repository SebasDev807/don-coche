import { getOrderDetail } from '@/actions/orders';
import { OrderDetailClient } from '@/components/dashboard/caja/OrderDetailClient';
import { verifyRole } from '@/lib/dal';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

  const res = await getOrderDetail(id);

  if (!res.success || !res.data) {
    notFound();
  }

  // Si la orden ya no está en pista, podríamos mostrarla pero desactivar facturación,
  // por ahora la enviaremos al cliente igual.
  return (
    <div className="h-full bg-gray-50/50 p-6 overflow-y-auto">
      <OrderDetailClient order={res.data} />
    </div>
  );
}
