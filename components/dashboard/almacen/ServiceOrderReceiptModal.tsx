'use client';

import { useEffect, useRef } from 'react';
import { BUSINESS_INFO } from '@/constants/business';

interface ServiceOrderReceiptModalProps {
  order: {
    id: string;
    orderNumber: number;
    billedAt: string | Date;
    paymentMethod: string;
    grandTotal: number;
    cufe: string | null;
    aliaddoConsecutive: string | null;
    aliaddoInvoiceStatus: string | null;
    aliaddoErrorMessage?: string | null;
    vehicle: {
      plate: string;
      brand: string | null;
      model: string | null;
      color: string | null;
      customer: { name: string | null; cc: string | null } | null;
    };
    admin: { name: string } | null;
    services: {
      id: string;
      chargedPrice: number;
      service: { name: string };
    }[];
    products?: {
      id: string;
      quantity: number;
      unitPrice: number;
      product: { name: string; iva: any };
    }[];
  };
  onClose: () => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
};

function formatCurrency(v: number) {
  return `$${Math.round(v).toLocaleString('es-CO')}`;
}
function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function ServiceOrderReceiptModal({ order, onClose }: ServiceOrderReceiptModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const isSuccess = order.cufe && order.aliaddoInvoiceStatus !== 'ERROR' && order.aliaddoInvoiceStatus !== 'Rechazada';
  const isError = order.aliaddoInvoiceStatus === 'ERROR';
  const isRejected = order.aliaddoInvoiceStatus === 'Rechazada';
  const isOmitted = order.aliaddoInvoiceStatus === 'OMITIDA';

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #svc-receipt-root, #svc-receipt-root * { visibility: visible; }
          #svc-receipt-root { position: absolute; left: 0; top: 0; width: 100%; }
          .receipt-no-print { display: none !important; }
          @page { size: 80mm auto; margin: 0; }
        }
        @keyframes srFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes srSlideUp { from { opacity: 0; transform: translateY(14px) scale(.97) } to { opacity: 1; transform: none } }
      `}</style>

      <div
        ref={backdropRef}
        onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'srFadeIn .2s ease-out',
        }}
      >
        <div style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', animation: 'srSlideUp .3s ease-out',
        }}>
          {/* Modal header */}
          <div className="receipt-no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '24px' }}>check_circle</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>¡Servicio Facturado!</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Orden #{String(order.orderNumber).padStart(4, '0')}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6b7280' }}>close</span>
            </button>
          </div>

          {/* Receipt area */}
          <div style={{ overflowY: 'auto', padding: '20px', background: '#f9fafb', flex: 1 }}>
            <div id="svc-receipt-root" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: '302px', fontFamily: "'Courier New', Courier, monospace",
                fontSize: '12px', lineHeight: '1.4', color: '#000',
                background: '#fff', padding: '12px 8px', margin: '0 auto',
              }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px' }}>{BUSINESS_INFO.name.toUpperCase()}</div>
                  <div style={{ fontSize: '11px', marginTop: '2px' }}>{BUSINESS_INFO.legalName}</div>
                  <div style={{ fontSize: '10px', marginTop: '2px', color: '#555' }}>NIT: {BUSINESS_INFO.nit}</div>
                  <div style={{ fontSize: '10px', color: '#555' }}>{BUSINESS_INFO.address}</div>
                  <div style={{ fontSize: '10px', color: '#555' }}>Tel: {BUSINESS_INFO.phone} — {BUSINESS_INFO.city}</div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '4px 0' }} />

                <div style={{ textAlign: 'center', margin: '6px 0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>ORDEN #{String(order.orderNumber).padStart(4, '0')}</div>
                  <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{formatDate(order.billedAt!)}</div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '4px 0' }} />

                <div style={{ margin: '6px 0', fontSize: '11px' }}>
                  <div style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Vehículo</div>
                  <div>Placa: <b>{order.vehicle.plate}</b></div>
                  {(order.vehicle.brand || order.vehicle.model) && (
                    <div>{[order.vehicle.brand, order.vehicle.model].filter(Boolean).join(' ')}{order.vehicle.color ? ` — ${order.vehicle.color}` : ''}</div>
                  )}
                  {order.vehicle.customer?.name && <div>Cliente: {order.vehicle.customer.name}</div>}
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '4px 0' }} />

                {order.services && order.services.length > 0 && (
                  <>
                    <div style={{ margin: '6px 0' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>Servicios</div>
                      {order.services.map((s, i) => (
                        <div key={`srv-${i}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '1px 0' }}>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>{s.service.name}</span>
                          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(s.chargedPrice)}</span>
                        </div>
                      ))}
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '4px 0' }} />
                  </>
                )}

                {order.products && order.products.length > 0 && (
                  <>
                    <div style={{ margin: '6px 0' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>Productos</div>
                      {order.products.map((p, i) => (
                        <div key={`prod-${i}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '1px 0' }}>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                            {p.quantity}x {p.product.name}
                            {p.product.iva ? ` (IVA ${Number(p.product.iva)}%)` : ''}
                          </span>
                          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(Number(p.unitPrice) * p.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '4px 0' }} />
                  </>
                )}

                <div style={{ margin: '6px 0', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, padding: '4px 0' }}>
                    <span>TOTAL</span>
                    <span>{formatCurrency(order.grandTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '2px' }}>
                    <span>Pago</span>
                    <span style={{ fontWeight: 600 }}>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '4px 0' }} />

                <div style={{ textAlign: 'center', margin: '8px 0 4px', fontSize: '10px', color: '#555' }}>
                  {order.admin && <div>Facturado por: {order.admin.name}</div>}
                  <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 600 }}>{BUSINESS_INFO.tagline}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer acciones */}
          <div className="receipt-no-print" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 20px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
            {isSuccess && (
              <div style={{ padding: '12px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', color: '#065f46' }}>
                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                  Factura electrónica emitida — {order.aliaddoConsecutive || ''}
                </div>
                {order.cufe && <div style={{ fontSize: '11px', wordBreak: 'break-all', marginTop: '4px' }}>CUFE: {order.cufe}</div>}
              </div>
            )}
            {isError && (
              <div style={{ padding: '12px', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
                No fue posible emitir la factura electrónica
              </div>
            )}
            {isRejected && (
              <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cancel</span>
                Factura rechazada
              </div>
            )}
            {isOmitted && (
              <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt</span>
                Recibo POS generado (sin factura electrónica)
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fff', fontWeight: 600, fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                Cerrar
              </button>
              <button onClick={() => window.print()} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#1a1a2e', fontWeight: 700, fontSize: '14px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
                Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
