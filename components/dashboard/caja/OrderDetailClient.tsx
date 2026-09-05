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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');

  const subtotal = order.totalServices + order.totalProducts;
  const iva = subtotal * 0.19;
  const calculatedGrandTotal = subtotal + iva;

  const handleBill = async (method: PaymentMethod, emitirFactura: boolean) => {
    const actionLabel = emitirFactura ? 'Factura Electrónica DIAN' : 'Recibo POS (Sin electrónica)';
    const result = await MySwal.fire({
      title: emitirFactura ? 'Emitir Factura Electrónica' : 'Confirmar Cobro POS',
      text: `¿Desea facturar esta orden por $${calculatedGrandTotal.toLocaleString()} con ${method} como ${actionLabel}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: emitirFactura ? 'Sí, Emitir Factura Electrónica' : 'Sí, Generar Recibo POS',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: emitirFactura ? '#3085d6' : '#475569',
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      MySwal.showLoading();

      const res = await billOrder(order.id, method, emitirFactura);
      setIsSubmitting(false);

      if (res.success) {
        if (res.aliaddoSuccess && res.data.cufe) {
          await MySwal.fire({
            title: 'Factura electrónica emitida correctamente',
            html: `Factura: <b>${res.data.aliaddoConsecutive || 'N/A'}</b><br/>CUFE: <span style="font-size: 0.85em;">${res.data.cufe}</span>`,
            icon: 'success',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#3085d6',
          });
        } else if (!emitirFactura) {
          await MySwal.fire({
            title: 'Cobro Registrado',
            text: 'La orden se facturó exitosamente como Recibo POS.',
            icon: 'success',
            confirmButtonText: 'Ver Recibo',
            confirmButtonColor: '#3085d6',
          });
        } else {
          await MySwal.fire({
            title: 'Cobro registrado',
            html: `La venta se guardó correctamente, pero la factura electrónica está pendiente o falló.<br/><br/><b>Estado:</b> ${res.aliaddoStatus || 'Desconocido'}<br/><b>Detalle:</b> ${res.aliaddoError || 'N/A'}`,
            icon: 'warning',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#f59e0b',
          });
        }
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
    <div className="max-w-5xl mx-auto bg-surface-container-lowest border border-surface-variant rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      
      {/* Resumen de la Orden (Izquierda) */}
      <div className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => router.push('/caja')}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-on-surface">Orden #{order.orderNumber}</h1>
            <p className="text-on-surface-variant">Placa: <span className="font-bold text-on-surface">{order.vehicle.plate}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-surface-container p-4 rounded-lg">
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Cliente</p>
            <p className="font-medium text-on-surface">{order.vehicle.customer?.name || 'Consumidor Final'}</p>
          </div>
          <div className="bg-surface-container p-4 rounded-lg">
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Técnico Asignado</p>
            <p className="font-medium text-on-surface">{order.technician.name}</p>
          </div>
        </div>

        <h3 className="font-bold text-lg mb-4 text-on-surface border-b border-outline-variant pb-2">Servicios Solicitados</h3>
        <table className="w-full text-sm mb-8">
          <tbody>
            {order.services.map((os: any) => (
              <tr key={os.id} className="border-b border-outline-variant last:border-0">
                <td className="py-3 font-medium text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">build</span>
                  {os.service.name}
                </td>
                <td className="py-3 text-right font-bold text-on-surface">${os.chargedPrice.toLocaleString()}</td>
              </tr>
            ))}
            {order.services.length === 0 && (
              <tr>
                <td className="py-4 text-on-surface-variant italic">No hay servicios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>

        {order.products.length > 0 && (
          <>
            <h3 className="font-bold text-lg mb-4 text-on-surface border-b border-outline-variant pb-2">Repuestos / Insumos</h3>
            <table className="w-full text-sm mb-8">
              <thead className="text-xs text-on-surface-variant uppercase text-left">
                <tr>
                  <th className="pb-2">Producto</th>
                  <th className="pb-2 text-center">Cant.</th>
                  <th className="pb-2 text-right">Precio Unit.</th>
                  <th className="pb-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.products.map((op: any) => (
                  <tr key={op.id} className="border-b border-outline-variant last:border-0">
                    <td className="py-3 font-medium text-on-surface">{op.product.name}</td>
                    <td className="py-3 text-center">{op.quantity}</td>
                    <td className="py-3 text-right text-on-surface-variant">${op.unitPrice.toLocaleString()}</td>
                    <td className="py-3 text-right font-bold text-on-surface">${(op.quantity * op.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Panel de Facturación (Derecha) */}
      <div className="w-full md:w-[360px] bg-surface-container-highest text-on-surface p-8 flex flex-col">
        <h2 className="font-headline-md text-headline-md mb-8">Facturación</h2>
        
        <div className="space-y-4 mb-auto font-body-lg text-body-lg">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span>Total Servicios</span>
            <span className="font-label-bold text-on-surface">${order.totalServices.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-on-surface-variant">
            <span>Total Repuestos</span>
            <span className="font-label-bold text-on-surface">${order.totalProducts.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-on-surface-variant">
            <span>IVA (19%)</span>
            <span className="font-label-bold text-on-surface">${iva.toLocaleString()}</span>
          </div>
          <div className="pt-4 mt-4 border-t border-outline-variant flex justify-between items-end">
            <span className="uppercase text-sm font-label-bold tracking-wider text-on-surface-variant">Gran Total</span>
            <span className="text-3xl font-headline-lg text-primary">${calculatedGrandTotal.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {/* Selector de Método de Pago */}
          <div>
            <p className="text-xs font-label-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Método de Pago
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('EFECTIVO')}
                className={`py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 font-label-bold text-xs transition-all cursor-pointer ${
                  paymentMethod === 'EFECTIVO'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">payments</span>
                Efectivo
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('TARJETA')}
                className={`py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 font-label-bold text-xs transition-all cursor-pointer ${
                  paymentMethod === 'TARJETA'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">credit_card</span>
                Tarjeta
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFERENCIA')}
                className={`py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 font-label-bold text-xs transition-all cursor-pointer ${
                  paymentMethod === 'TRANSFERENCIA'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
                Transferencia
              </button>
            </div>
          </div>

          {/* Botones Explícitos de Facturación */}
          <div className="space-y-3">
            <button 
              onClick={() => handleBill(paymentMethod, false)}
              disabled={isSubmitting}
              className="w-full bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-outline-variant transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-sm shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">receipt</span>
              Generar Recibo POS (Sin Electrónica)
            </button>

            <button 
              onClick={() => handleBill(paymentMethod, true)}
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-on-primary font-label-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-sm"
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              Enviar Factura Electrónica (DIAN)
            </button>
          </div>
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
