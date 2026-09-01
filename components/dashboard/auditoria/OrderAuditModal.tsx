'use client';

import { useState, useEffect } from 'react';
import { getOrderDetail } from '@/actions/orders';

interface OrderAuditModalProps {
  orderId: string | null;
  onClose: () => void;
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  FACTURADA: { label: 'COMPLETADO', bg: 'bg-[#E6F4EA]', text: 'text-[#137333]' },
  CANCELADA: { label: 'CANCELADA',  bg: 'bg-[#FDE8E8]', text: 'text-[#ba1a1a]' },
  EN_PISTA:  { label: 'EN PISTA',   bg: 'bg-[#FEF7E0]', text: 'text-[#B06000]' },
};

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO:      'Efectivo',
  TARJETA:       'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
};

export function OrderAuditModal({ orderId, onClose }: OrderAuditModalProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    setLoading(true);
    getOrderDetail(orderId)
      .then((res) => { if (res.success) setOrder(res.data); })
      .finally(() => setLoading(false));
  }, [orderId]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const isOpen = !!orderId;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel lateral */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-surface-container-lowest border-l border-surface-variant shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header del modal */}
        <div className="flex items-center justify-between p-6 border-b border-surface-variant">
          <div>
            <h2 className="text-xl font-black text-on-surface">
              {loading ? 'Cargando...' : order ? `Orden #${order.orderNumber}` : 'Detalle de Orden'}
            </h2>
            {order && (
              <p className="text-sm text-on-surface-variant mt-0.5">
                Placa: <span className="font-bold text-on-surface">{order.vehicle?.plate}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-variant transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && !order && (
            <p className="text-center text-on-surface-variant py-8">No se encontró la orden.</p>
          )}

          {!loading && order && (() => {
            const statusInfo = STATUS_MAP[order.status] ?? { label: order.status, bg: 'bg-surface-variant', text: 'text-on-surface-variant' };
            return (
              <>
                {/* Badges de estado y pago */}
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusInfo.bg} ${statusInfo.text}`}>
                    {statusInfo.label}
                  </span>
                  {order.paymentMethod && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px]">
                        {order.paymentMethod === 'EFECTIVO' ? 'payments' : order.paymentMethod === 'TARJETA' ? 'credit_card' : 'account_balance'}
                      </span>
                      {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                    </span>
                  )}
                </div>

                {/* Info del vehículo y personas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container p-3 rounded-lg">
                    <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Cliente</p>
                    <p className="text-sm font-medium text-on-surface">{order.vehicle?.customer?.name || 'Consumidor Final'}</p>
                    {order.vehicle?.customer?.phone && (
                      <p className="text-xs text-on-surface-variant mt-0.5">{order.vehicle.customer.phone}</p>
                    )}
                  </div>
                  <div className="bg-surface-container p-3 rounded-lg">
                    <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Vehículo</p>
                    <p className="text-sm font-bold text-on-surface">{order.vehicle?.plate}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {[order.vehicle?.brand, order.vehicle?.model, order.vehicle?.color].filter(Boolean).join(' · ') || 'Sin detalles'}
                    </p>
                  </div>
                  <div className="bg-surface-container p-3 rounded-lg">
                    <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Técnico</p>
                    <p className="text-sm font-medium text-on-surface">{order.technician?.name}</p>
                  </div>
                  {order.admin && (
                    <div className="bg-surface-container p-3 rounded-lg">
                      <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Cobrado por</p>
                      <p className="text-sm font-medium text-on-surface">{order.admin.name}</p>
                    </div>
                  )}
                </div>

                {/* Servicios */}
                <div>
                  <h3 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider mb-3 border-b border-surface-variant pb-2">
                    Servicios
                  </h3>
                  {order.services.length === 0 ? (
                    <p className="text-sm text-on-surface-variant italic">Sin servicios.</p>
                  ) : (
                    <div className="space-y-2">
                      {order.services.map((s: any) => (
                        <div key={s.id} className="flex justify-between items-center py-2 border-b border-surface-variant last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">build</span>
                            <span className="text-sm text-on-surface">{s.service.name}</span>
                          </div>
                          <span className="text-sm font-bold text-on-surface">${s.chargedPrice.toLocaleString('es-CO')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Productos */}
                {order.products.length > 0 && (
                  <div>
                    <h3 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider mb-3 border-b border-surface-variant pb-2">
                      Repuestos / Insumos
                    </h3>
                    <div className="space-y-2">
                      {order.products.map((p: any) => (
                        <div key={p.id} className="flex justify-between items-center py-2 border-b border-surface-variant last:border-0">
                          <div>
                            <span className="text-sm text-on-surface">{p.product.name}</span>
                            <span className="text-xs text-on-surface-variant ml-2">x{p.quantity}</span>
                          </div>
                          <span className="text-sm font-bold text-on-surface">${(p.quantity * p.unitPrice).toLocaleString('es-CO')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Footer con totales */}
        {!loading && order && (
          <div className="p-6 border-t border-surface-variant bg-surface-container space-y-2">
            <div className="flex justify-between text-sm text-on-surface-variant">
              <span>Total Servicios</span>
              <span className="font-bold text-on-surface">${order.totalServices.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-sm text-on-surface-variant">
              <span>Total Repuestos</span>
              <span className="font-bold text-on-surface">${order.totalProducts.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-sm text-on-surface-variant">
              <span>IVA (19%)</span>
              <span className="font-bold text-on-surface">${(order.grandTotal - (order.totalServices + order.totalProducts)).toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between items-end pt-3 border-t border-surface-variant">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Gran Total</span>
              <span className="text-2xl font-black text-on-surface">${order.grandTotal.toLocaleString('es-CO')}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
