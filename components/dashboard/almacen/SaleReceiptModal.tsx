'use client';

import { useEffect, useRef } from 'react';
import { BUSINESS_INFO } from '@/constants/business';

interface SaleReceiptModalProps {
  sale: {
    saleNumber: number;
    soldAt: string | Date;
    paymentMethod: string;
    customerName: string | null;
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
      ivaRate: number;
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
  return `$${v.toLocaleString('es-CO')}`;
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

      {/* Backdrop */}
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
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
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
              {/* POS Receipt */}
              <div
                style={{
                  width: '302px', fontFamily: "'Courier New', Courier, monospace",
                  fontSize: '12px', lineHeight: '1.4', color: '#000',
                  background: '#fff', padding: '12px 8px', margin: '0 auto',
                }}
              >
                {/* Header negocio */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px' }}>
                    {BUSINESS_INFO.name.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '2px' }}>{BUSINESS_INFO.legalName}</div>
                  <div style={{ fontSize: '10px', marginTop: '2px', color: '#555' }}>NIT: {BUSINESS_INFO.nit}</div>
                  <div style={{ fontSize: '10px', color: '#555' }}>{BUSINESS_INFO.address}</div>
                  <div style={{ fontSize: '10px', color: '#555' }}>Tel: {BUSINESS_INFO.phone} — {BUSINESS_INFO.city}</div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '4px 0' }} />

                {/* Número y fecha */}
                <div style={{ textAlign: 'center', margin: '6px 0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    VENTA ALMACÉN #{String(sale.saleNumber).padStart(4, '0')}
                  </div>
                  <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>
                    {formatDate(sale.soldAt)}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '4px 0' }} />

                {/* Cliente */}
                <div style={{ margin: '6px 0', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                    <span style={{ color: '#555' }}>Cliente:</span>
                    <span>{sale.customerName || 'Consumidor Final'}</span>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '4px 0' }} />

                {/* Productos */}
                <div style={{ margin: '6px 0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Productos
                  </div>
                  {sale.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '1px 0' }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                        {item.quantity}x {item.product.name}
                      </span>
                      <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '4px 0' }} />

                {/* Totales */}
                <div style={{ margin: '6px 0', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(sale.subtotal)}</span>
                  </div>
                  {sale.ivaAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                      <span>IVA</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(sale.ivaAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, marginTop: '6px', padding: '4px 0', borderTop: '1px dashed #000' }}>
                    <span>TOTAL</span>
                    <span>{formatCurrency(sale.grandTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '2px' }}>
                    <span>Método de Pago</span>
                    <span style={{ fontWeight: 600 }}>{PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}</span>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '4px 0' }} />

                {/* Footer */}
                <div style={{ textAlign: 'center', margin: '8px 0 4px', fontSize: '10px', color: '#555' }}>
                  {sale.admin && <div>Atendido por: {sale.admin.name}</div>}
                  <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 600 }}>{BUSINESS_INFO.tagline}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div
            className="receipt-no-print"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 20px', borderTop: '1px solid #e5e7eb', background: '#fff' }}
          >
            {/* Estado factura electrónica */}
            {isSuccess && (
              <div style={{ padding: '12px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', color: '#065f46' }}>
                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                  Factura electrónica emitida
                </div>
                <div style={{ fontSize: '12px', marginTop: '6px' }}>
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
