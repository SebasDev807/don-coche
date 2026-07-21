'use client';

import { useEffect, useRef } from 'react';
import { PosReceipt } from './PosReceipt';

interface ReceiptModalProps {
  order: any;
  onClose: () => void;
}

export function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Cerrar al hacer click en el backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* ── Estilos de impresión ── */}
      <style>{`
        @media print {
          /* Ocultar fondo y resto de la app, mostrar solo el recibo */
          body * {
            visibility: hidden;
          }
          #receipt-print-root, #receipt-print-root * {
            visibility: visible;
          }
          #receipt-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .receipt-no-print {
            display: none !important;
          }

          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        id="receipt-modal-backdrop"
        ref={backdropRef}
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          animation: 'receiptFadeIn 0.2s ease-out',
        }}
      >
        {/* ── Panel del modal ── */}
        <div
          id="receipt-modal-panel"
          style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'receiptSlideUp 0.3s ease-out',
          }}
        >
          {/* ── Header del modal ── */}
          <div
            className="receipt-no-print"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                className="material-symbols-outlined"
                style={{ color: '#16a34a', fontSize: '24px' }}
              >
                check_circle
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>
                  ¡Orden Facturada!
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Recibo #{String(order.orderNumber).padStart(4, '0')}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: '#f3f4f6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e5e7eb')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#f3f4f6')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6b7280' }}>
                close
              </span>
            </button>
          </div>

          {/* ── Contenido scrolleable con el recibo ── */}
          <div
            style={{
              overflowY: 'auto',
              padding: '20px',
              background: '#f9fafb',
              flex: 1,
            }}
          >
            <div
              id="receipt-print-root"
              style={{
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <PosReceipt order={order} />
            </div>
          </div>

          {/* ── Acciones del modal ── */}
          <div
            className="receipt-no-print"
            style={{
              display: 'flex',
              gap: '12px',
              padding: '16px 20px',
              borderTop: '1px solid #e5e7eb',
              background: '#fff',
            }}
          >
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
                background: '#fff',
                fontWeight: 600,
                fontSize: '14px',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: '#1a1a2e',
                fontWeight: 700,
                fontSize: '14px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2d2d4a')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#1a1a2e')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
              Imprimir Recibo
            </button>
          </div>
        </div>
      </div>

      {/* ── Keyframes para animaciones ── */}
      <style>{`
        @keyframes receiptFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes receiptSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
