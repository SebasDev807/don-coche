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
    technician?: { name: string } | null;
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

const BASE_TICKET: React.CSSProperties = {
  width: '80mm',
  maxWidth: '100%',
  boxSizing: 'border-box',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '11px',
  lineHeight: '1.5',
  color: '#000',
  background: '#fff',
  padding: '14px 10px',
  margin: '0 auto',
  fontWeight: 700,
};

function Divider() {
  return <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', gap: '6px' }}>
      <span style={{ fontWeight: 700, flexShrink: 0 }}>{label}:</span>
      <span style={{ fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
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

  // Calcular totales con IVA desglosado
  let ivaTotal = 0;
  let productBase = 0;
  if (order.products) {
    for (const p of order.products) {
      const unitPrice = Number(p.unitPrice);
      const ivaRate = p.product.iva ? Number(p.product.iva) / 100 : 0;
      if (ivaRate > 0) {
        const base = unitPrice / (1 + ivaRate);
        ivaTotal += (unitPrice - base) * p.quantity;
        productBase += base * p.quantity;
      } else {
        productBase += unitPrice * p.quantity;
      }
    }
  }
  const totalServices = order.services.reduce((acc, s) => acc + Number(s.chargedPrice), 0);
  const subtotal = totalServices + productBase;

  const vehicleDesc = [order.vehicle.brand, order.vehicle.model, order.vehicle.color].filter(Boolean).join(' ');

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #svc-receipt-root, #svc-receipt-root * { visibility: visible; }
          #svc-receipt-root { position: absolute; left: 0; top: 0; width: 100%; }
          #svc-receipt-root > div {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            padding: 10px 8px !important;
          }
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
                <div style={{ fontSize: '9.5px', color: '#6b7280' }}>Orden #{String(order.orderNumber).padStart(4, '0')}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6b7280' }}>close</span>
            </button>
          </div>

          {/* Receipt area */}
          <div style={{ overflowY: 'auto', padding: '20px', background: '#f9fafb', flex: 1 }}>
            <div id="svc-receipt-root" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={BASE_TICKET}>
                {/* Header negocio */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '1px' }}>{BUSINESS_INFO.name.toUpperCase()}</div>
                  <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 700 }}>{BUSINESS_INFO.legalName}</div>
                  <div style={{ fontSize: '11px', marginTop: '2px', fontWeight: 700 }}>NIT: {BUSINESS_INFO.nit}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700 }}>{BUSINESS_INFO.address}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700 }}>Tel: {BUSINESS_INFO.phone} — {BUSINESS_INFO.city}</div>
                </div>

                <Divider />

                {/* Número y fecha */}
                <div style={{ textAlign: 'center', margin: '6px 0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 900 }}>ORDEN #{String(order.orderNumber).padStart(4, '0')}</div>
                  <div style={{ fontSize: '11px', marginTop: '2px', fontWeight: 700 }}>{formatDate(order.billedAt!)}</div>
                </div>

                <Divider />

                {/* Datos vehículo */}
                <div style={{ margin: '6px 0', fontSize: '10px' }}>
                  {order.vehicle.plate !== 'GEN-000' ? (
                    <>
                      <Row label="Placa" value={order.vehicle.plate} />
                      {vehicleDesc && <Row label="Vehículo" value={vehicleDesc} />}
                    </>
                  ) : null}
                  {order.vehicle.customer?.name && <Row label="Cliente" value={order.vehicle.customer.name} />}
                  {order.vehicle.customer?.cc && <Row label="CC" value={order.vehicle.customer.cc} />}
                  <Row label="Técnico" value={order.technician?.name || order.admin?.name || 'N/A'} />
                  {order.admin && <Row label="Cajero" value={order.admin.name} />}
                </div>

                <Divider />

                {/* Servicios */}
                {order.services && order.services.length > 0 && (
                  <>
                    <div style={{ margin: '6px 0' }}>
                      <div style={{ fontSize: '10px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}>Servicios</div>
                      {order.services.map((s, i) => (
                        <div key={`srv-${i}`} style={{ fontSize: '10px', padding: '2px 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                            <span style={{ flex: 1, fontWeight: 700, wordBreak: 'break-word' }}>- {s.service.name}</span>
                            <span style={{ fontWeight: 900, flexShrink: 0 }}>{formatCurrency(s.chargedPrice)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Divider />
                  </>
                )}

                {/* Productos */}
                {order.products && order.products.length > 0 && (
                  <>
                    <div style={{ margin: '6px 0' }}>
                      <div style={{ fontSize: '10px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}>Repuestos / Productos</div>
                      {order.products.map((p, i) => {
                        const unitPrice = Number(p.unitPrice);
                        const qty = Number(p.quantity);
                        const ivaRate = p.product?.iva ? Number(p.product.iva) / 100 : 0;
                        const base = ivaRate > 0 ? unitPrice / (1 + ivaRate) : unitPrice;
                        const ivaUnitAmt = unitPrice - base;
                        return (
                          <div key={`prod-${i}`} style={{ fontSize: '10px', padding: '2px 0', marginBottom: '2px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                              <span style={{ flex: 1, fontWeight: 700, wordBreak: 'break-word' }}>- {p.product?.name}</span>
                              <span style={{ fontWeight: 900, flexShrink: 0 }}>{formatCurrency(qty * unitPrice)}</span>
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 700, paddingLeft: '8px', marginTop: '1px' }}>
                              {qty} und{qty !== 1 ? 's' : ''} x {formatCurrency(unitPrice)}
                              {ivaRate > 0
                                ? ` | Base: ${formatCurrency(base)} + IVA(${Number(p.product.iva)}%): ${formatCurrency(ivaUnitAmt)}`
                                : ' | IVA: 0%'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Divider />
                  </>
                )}

                {/* Totales */}
                <div style={{ margin: '6px 0', fontSize: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontWeight: 700 }}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {ivaTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontWeight: 700 }}>
                      <span>IVA</span>
                      <span>{formatCurrency(ivaTotal)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 900, padding: '4px 0', borderTop: '2px solid #000', marginTop: '6px' }}>
                    <span>TOTAL</span>
                    <span>{formatCurrency(order.grandTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px', fontWeight: 700 }}>
                    <span>Pago</span>
                    <span>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
                  </div>
                </div>

                <Divider />

                {/* Footer */}
                <div style={{ textAlign: 'center', margin: '8px 0 4px', fontSize: '11px', fontWeight: 700 }}>
                  {order.admin && <div>Facturado por: {order.admin.name}</div>}
                  <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: 900 }}>{BUSINESS_INFO.tagline}</div>
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
