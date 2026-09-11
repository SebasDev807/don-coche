import { verifyRole } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { OrderEditClient } from './OrderEditClient';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Editar Orden | Don Coche',
};

export default async function EditOrderPage({ params }: PageProps) {
  await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      vehicle: { include: { customer: true } }
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b border-surface-variant pb-6">
        <Link
          href="/auditoria"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low text-on-surface hover:bg-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="font-display-md text-3xl font-black text-on-surface">
            Editar Orden #{order.orderNumber}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Placa: {order.vehicle.plate} | Fecha: {order.createdAt.toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="bg-error-container/20 border border-error/50 p-4 rounded-xl flex gap-3 text-sm text-on-surface">
        <span className="material-symbols-outlined text-error">info</span>
        <div>
          <strong className="block text-error mb-1">Nota sobre modificaciones operativas</strong>
          Para mantener la integridad contable y del inventario, desde aquí solo puedes modificar el estado de la orden y su método de pago.
          Si requieres agregar o quitar productos/servicios a una orden ya facturada, debes <b>Cancelar</b> esta orden y generar una nueva desde el Punto de Venta o Taller.
        </div>
      </div>

      <OrderEditClient order={order} />
    </div>
  );
}
