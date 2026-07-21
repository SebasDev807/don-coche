'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { billOrder, cancelOrder } from '@/actions/orders';
import { PaymentMethod } from '@prisma/client';
import { ReceiptModal } from './ReceiptModal';

const MySwal = withReactContent(Swal);

interface OrderDetailClientProps {
  order: any;
}

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billedOrderData, setBilledOrderData] = useState<any>(null);

  const handleBill = async (method: PaymentMethod) => {
    const result = await MySwal.fire({
      title: 'Confirmar Cobro',
      text: `¿Desea facturar esta orden por $${order.grandTotal.toLocaleString()} con ${method}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Facturar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      MySwal.showLoading();

      const res = await billOrder(order.id, method);
      setIsSubmitting(false);

      if (res.success) {
        MySwal.close();
        setBilledOrderData(res.data);
      } else {
        MySwal.fire('Error', res.message, 'error');
      }
    }
  };

  const handleCancel = async () => {
    const result = await MySwal.fire({
      title: '¿Cancelar Orden?',
      text: 'Esta acción anulará la orden y no se descontará inventario.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Cancelar Orden',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      MySwal.showLoading();

      const res = await cancelOrder(order.id);
      setIsSubmitting(false);

      if (res.success) {
        await MySwal.fire('Cancelada', 'La orden ha sido anulada.', 'success');
        router.push('/caja');
      } else {
        MySwal.fire('Error', res.message, 'error');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      
      {/* Resumen de la Orden (Izquierda) */}
      <div className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => router.push('/caja')}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-gray-600">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Orden #{order.orderNumber}</h1>
            <p className="text-gray-500">Placa: <span className="font-bold text-gray-800">{order.vehicle.plate}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Cliente</p>
            <p className="font-medium text-gray-900">{order.vehicle.customer?.name || 'Consumidor Final'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Técnico Asignado</p>
            <p className="font-medium text-gray-900">{order.technician.name}</p>
          </div>
        </div>

        <h3 className="font-bold text-lg mb-4 text-gray-900 border-b pb-2">Servicios Solicitados</h3>
        <table className="w-full text-sm mb-8">
          <tbody>
            {order.services.map((os: any) => (
              <tr key={os.id} className="border-b border-gray-100 last:border-0">
                <td className="py-3 font-medium text-gray-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-400 text-[18px]">build</span>
                  {os.service.name}
                </td>
                <td className="py-3 text-right font-bold text-gray-900">${os.chargedPrice.toLocaleString()}</td>
              </tr>
            ))}
            {order.services.length === 0 && (
              <tr>
                <td className="py-4 text-gray-400 italic">No hay servicios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>

        {order.products.length > 0 && (
          <>
            <h3 className="font-bold text-lg mb-4 text-gray-900 border-b pb-2">Repuestos / Insumos</h3>
            <table className="w-full text-sm mb-8">
              <thead className="text-xs text-gray-500 uppercase text-left">
                <tr>
                  <th className="pb-2">Producto</th>
                  <th className="pb-2 text-center">Cant.</th>
                  <th className="pb-2 text-right">Precio Unit.</th>
                  <th className="pb-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.products.map((op: any) => (
                  <tr key={op.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 font-medium text-gray-800">{op.product.name}</td>
                    <td className="py-3 text-center">{op.quantity}</td>
                    <td className="py-3 text-right text-gray-500">${op.unitPrice.toLocaleString()}</td>
                    <td className="py-3 text-right font-bold text-gray-900">${(op.quantity * op.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Panel de Facturación (Derecha) */}
      <div className="w-full md:w-[350px] bg-on-surface text-surface p-8 flex flex-col">
        <h2 className="font-headline-md text-headline-md mb-8">Facturación</h2>
        
        <div className="space-y-4 mb-auto font-body-lg text-body-lg">
          <div className="flex justify-between items-center text-surface-variant">
            <span>Total Servicios</span>
            <span className="font-label-bold text-surface">${order.totalServices.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-surface-variant">
            <span>Total Repuestos</span>
            <span className="font-label-bold text-surface">${order.totalProducts.toLocaleString()}</span>
          </div>
          <div className="pt-4 mt-4 border-t border-outline flex justify-between items-end">
            <span className="uppercase text-sm font-label-bold tracking-wider text-surface-variant">Gran Total</span>
            <span className="text-4xl font-headline-lg text-[#FFEC00]">${order.grandTotal.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-12 space-y-3">
          <p className="text-xs font-label-bold text-surface-variant uppercase tracking-wider mb-2 text-center">Seleccionar Método de Pago</p>
          <button 
            onClick={() => handleBill('EFECTIVO')}
            disabled={isSubmitting}
            className="w-full bg-surface-container-highest hover:bg-surface-container text-on-surface font-label-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">payments</span>
            Efectivo
          </button>
          <button 
            onClick={() => handleBill('TARJETA')}
            disabled={isSubmitting}
            className="w-full bg-surface-container-highest hover:bg-surface-container text-on-surface font-label-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">credit_card</span>
            Tarjeta
          </button>
          <button 
            onClick={() => handleBill('TRANSFERENCIA')}
            disabled={isSubmitting}
            className="w-full bg-surface-container-highest hover:bg-surface-container text-on-surface font-label-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">account_balance</span>
            Transferencia
          </button>
        </div>

        <button 
          onClick={handleCancel}
          disabled={isSubmitting}
          className="mt-8 text-error hover:text-error-container text-sm font-label-bold transition-colors w-full text-center disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          Anular Orden
        </button>
      </div>

      {/* Modal de recibo POS post-facturación */}
      {billedOrderData && (
        <ReceiptModal
          order={billedOrderData}
          onClose={() => router.push('/caja')}
        />
      )}
    </div>
  );
}
