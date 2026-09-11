'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderAdmin } from '@/actions/auditoria/auditoria.actions';
import { PaymentMethod, OrderStatus, Order } from '@prisma/client';

interface OrderEditClientProps {
  order: Order;
}

export function OrderEditClient({ order }: OrderEditClientProps) {
  const router = useRouter();
  
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(order.paymentMethod || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const result = await updateOrderAdmin(order.id, {
        status,
        paymentMethod: paymentMethod as PaymentMethod || 'EFECTIVO', // Fallback en caso de estar vacío
      });

      if (result.success) {
        setSuccessMsg(result.message);
        setTimeout(() => {
          router.push('/auditoria');
        }, 1500);
      } else {
        setErrorMsg(result.message);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Error de red al actualizar la orden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
            Estado de la Orden
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
          >
            <option value="EN_PISTA">EN PISTA (Pendiente)</option>
            <option value="FACTURADA">FACTURADA (Completada)</option>
            <option value="CANCELADA">CANCELADA</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
            Método de Pago
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            disabled={status !== 'FACTURADA'}
            className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer disabled:opacity-50 disabled:bg-surface-container"
          >
            <option value="" disabled>Seleccione...</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
          {status !== 'FACTURADA' && (
            <p className="text-xs text-on-surface-variant mt-1">El método de pago solo aplica a órdenes facturadas.</p>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-error-container/30 border border-error/50 text-error text-sm p-4 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-[#ecfdf5] border border-[#10b981] text-[#065f46] text-sm p-4 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          {successMsg}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
        <button
          type="button"
          onClick={() => router.push('/auditoria')}
          disabled={isSubmitting || !!successMsg}
          className="px-6 py-2.5 rounded-xl border border-outline-variant text-on-surface font-bold hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !!successMsg}
          className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <span className="material-symbols-outlined animate-spin">refresh</span>
          ) : (
            <span className="material-symbols-outlined">save</span>
          )}
          Guardar Cambios
        </button>
      </div>
    </form>
  );
}
