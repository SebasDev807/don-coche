'use client';

import { useEffect, useRef } from 'react';
import { BUSINESS_INFO } from '@/constants/business';

interface SaleReceiptModalProps {
  sale: {
    saleNumber: number;
    soldAt: string | Date;
    paymentMethod: string;
    customerName: string | null;
    customerCc?: string | null;
    customerPhone?: string | null;
    subtotal: number;
    ivaAmount: number;
    grandTotal: number;
    aliaddoConsecutive: string | null;
    cufe: string | null;
    aliaddoInvoiceStatus: string | null;
    aliaddoErrorMessage?: string | null;
    admin: { name: string } | null;
    items: {
      id: string;
      quantity: number;
      unitPrice: number;
      ivaRate: any;
      product: { name: string };
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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
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

export function SaleReceiptModal({ sale, onClose }: SaleReceiptModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isSuccess = sale.cufe && (!sale.aliaddoInvoiceStatus || sale.aliaddoInvoiceStatus === 'PROCESADA' || sale.aliaddoInvoiceStatus === 'Valida');
  const isError = sale.aliaddoInvoiceStatus === 'ERROR';
  const isRejected = sale.aliaddoInvoiceStatus === 'Rechazada';
  const isOmitted = sale.aliaddoInvoiceStatus === 'OMITIDA';

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #almacen-receipt-root, #almacen-receipt-root * { visibility: visible; }
          #almacen-receipt-root {
            position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0;
          }
          #almacen-receipt-root > div {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            padding: 10px 8px !important;
          }
          .receipt-no-print { display: none !important; }
          @page { size: 80mm auto; margin: 0; }
        }
      `}</style>

      <style>{`
        @keyframes saleReceiptFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes saleReceiptSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        ref={backdropRef}
        onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          animation: 'saleReceiptFadeIn 0.2s ease-out',
        }}
      >
        <div
          style={{
            background: '#fff', borderRadius: '16px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', animation: 'saleReceiptSlideUp 0.3s ease-out',
          }}
        >
          {/* Header modal */}
          <div
            className="receipt-no-print"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '24px' }}>check_circle</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>¡Venta Registrada!</div>
                <div style={{ fontSize: '9.5px', color: '#6b7280' }}>
                  Venta Almacén #{String(sale.saleNumber).padStart(4, '0')}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e5e7eb')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#f3f4f6')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6b7280' }}>close</span>
            </button>
          </div>

          {/* Receipt scroll area */}
          <div style={{ overflowY: 'auto', padding: '20px', background: '#f9fafb', flex: 1 }}>
            <div
              id="almacen-receipt-root"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)', borderRadius: '4px', overflow: 'hidden' }}
            >
              <div style={BASE_TICKET}>
                {/* Header negocio */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '1px' }}>
                    {BUSINESS_INFO.name.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 700 }}>{BUSINESS_INFO.legalName}</div>
                  <div style={{ fontSize: '11px', marginTop: '2px', fontWeight: 700 }}>NIT: {BUSINESS_INFO.nit}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700 }}>{BUSINESS_INFO.address}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700 }}>Tel: {BUSINESS_INFO.phone} — {BUSINESS_INFO.city}</div>
                </div>

                <Divider />

                {/* Número y fecha */}
                <div style={{ textAlign: 'center', margin: '6px 0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 900 }}>
                    VENTA ALMACÉN #{String(sale.saleNumber).padStart(4, '0')}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '2px', fontWeight: 700 }}>
                    {formatDate(sale.soldAt)}
                  </div>
                </div>

                <Divider />

                {/* Cliente y responsable */}
                <div style={{ margin: '6px 0', fontSize: '10px' }}>
                  <Row label="Cliente" value={sale.customerName || 'Consumidor Final'} />
                  {sale.customerCc && <Row label="CC/NIT" value={sale.customerCc} />}
                  {sale.customerPhone && <Row label="Teléfono" value={sale.customerPhone} />}
                  {sale.admin && <Row label="Atendido por" value={sale.admin.name} />}
                </div>

                <Divider />

                {/* Productos */}
                <div style={{ margin: '6px 0' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}>
                    Productos
                  </div>
                  {sale.items.map((item, idx) => {
                    const unitPrice = Number(item.unitPrice);
                    const qty = Number(item.quantity);
                    const ivaRate = item.ivaRate ? Number(item.ivaRate) / 100 : 0;
                    const base = ivaRate > 0 ? unitPrice / (1 + ivaRate) : unitPrice;
                    const ivaUnitAmt = unitPrice - base;
                    return (
                      <div key={idx} style={{ fontSize: '10px', padding: '2px 0', marginBottom: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                          <span style={{ flex: 1, fontWeight: 700, wordBreak: 'break-word' }}>- {item.product.name}</span>
                          <span style={{ fontWeight: 900, flexShrink: 0 }}>{formatCurrency(qty * unitPrice)}</span>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 700, paddingLeft: '8px', marginTop: '1px' }}>
                          {qty} und{qty !== 1 ? 's' : ''} x {formatCurrency(unitPrice)}
                          {ivaRate > 0
                            ? ` | Base: ${formatCurrency(base)} + IVA(${Math.round(ivaRate * 100)}%): ${formatCurrency(ivaUnitAmt)}`
                            : ' | IVA: 0%'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Divider />

                {/* Totales */}
                <div style={{ margin: '6px 0', fontSize: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontWeight: 700 }}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(sale.subtotal)}</span>
                  </div>
                  {sale.ivaAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontWeight: 700 }}>
                      <span>IVA</span>
                      <span>{formatCurrency(sale.ivaAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 900, marginTop: '6px', padding: '4px 0', borderTop: '2px solid #000' }}>
                    <span>TOTAL</span>
                    <span>{formatCurrency(sale.grandTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px', fontWeight: 700 }}>
                    <span>Método de Pago</span>
                    <span>{PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}</span>
                  </div>
                </div>

                <Divider />

                {/* Footer */}
                <div style={{ textAlign: 'center', margin: '8px 0 4px', fontSize: '11px', fontWeight: 700 }}>
                  {sale.admin && <div>Atendido por: {sale.admin.name}</div>}
                  <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: 900 }}>{BUSINESS_INFO.tagline}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div
            className="receipt-no-print"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 20px', borderTop: '1px solid #e5e7eb', background: '#fff' }}
          >
            {isSuccess && (
              <div style={{ padding: '12px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', color: '#065f46' }}>
                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                  Factura electrónica emitida
                </div>
                <div style={{ fontSize: '10px', marginTop: '6px' }}>
                  <div>Factura: <b>{sale.aliaddoConsecutive || 'N/A'}</b></div>
                  <div style={{ wordBreak: 'break-all' }}>CUFE: {sale.cufe}</div>
                </div>
              </div>
            )}
            {isRejected && (
              <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', color: '#991b1b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cancel</span>
                Factura electrónica rechazada {sale.aliaddoErrorMessage ? `— ${sale.aliaddoErrorMessage}` : ''}
              </div>
            )}
            {isError && (
              <div style={{ padding: '12px', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', color: '#b45309', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
                No fue posible emitir la factura electrónica
              </div>
            )}
            {isOmitted && (
              <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt</span>
                Venta registrada como Recibo POS (sin factura electrónica)
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fff', fontWeight: 600, fontSize: '14px', color: '#374151', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#1a1a2e', fontWeight: 700, fontSize: '14px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#2d2d4a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#1a1a2e')}
              >
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
