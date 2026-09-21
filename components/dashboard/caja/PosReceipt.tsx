'use client';

import { BUSINESS_INFO } from '@/constants/business';

interface ReceiptService {
  id: string;
  chargedPrice: number;
  service: { name: string };
}

interface ReceiptProduct {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { name: string; iva?: number | null };
}

interface ReceiptOrder {
  orderNumber: number;
  billedAt: string | Date;
  paymentMethod: string;
  totalServices: number;
  totalProducts: number;
  grandTotal: number;
  vehicle: {
    plate: string;
    brand?: string | null;
    model?: string | null;
    color?: string | null;
    customer?: { name?: string | null; cc?: string | null; phone?: string | null } | null;
  };
  technician: { name: string };
  admin?: { name: string } | null;
  services: ReceiptService[];
  products: ReceiptProduct[];
}

interface PosReceiptProps {
  order: ReceiptOrder;
}

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
};

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString('es-CO')}`;
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Estilos base reutilizables
const BASE: React.CSSProperties = {
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
  fontWeight: 700, // negrita por defecto en todo el ticket
};

export function PosReceipt({ order }: PosReceiptProps) {
  const customerName = order.vehicle.customer?.name || 'Consumidor Final';
  const cc = order.vehicle.customer?.cc;
  const vehicleDesc = [order.vehicle.brand, order.vehicle.model, order.vehicle.color]
    .filter(Boolean)
    .join(' ');

  // Calcular subtotales e IVA
  const totalServices = Number(order.totalServices) || 0;
  let ivaTotal = 0;
  let productBase = 0;

  for (const p of order.products) {
    const unitPrice = Number(p.unitPrice);
    const qty = Number(p.quantity);
    const ivaRate = p.product?.iva ? Number(p.product.iva) / 100 : 0;
    if (ivaRate > 0) {
      const base = unitPrice / (1 + ivaRate);
      ivaTotal += (unitPrice - base) * qty;
      productBase += base * qty;
    } else {
      productBase += unitPrice * qty;
    }
  }
  const subtotal = totalServices + productBase;

  return (
    <div id="pos-receipt" style={BASE}>
      {/* Header negocio */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '1px' }}>
          {BUSINESS_INFO.name.toUpperCase()}
        </div>
        <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 700 }}>{BUSINESS_INFO.legalName}</div>
        <div style={{ fontSize: '9.5px', marginTop: '2px', fontWeight: 700 }}>NIT: {BUSINESS_INFO.nit}</div>
        <div style={{ fontSize: '9.5px', fontWeight: 700 }}>{BUSINESS_INFO.address}</div>
        <div style={{ fontSize: '9.5px', fontWeight: 700 }}>Tel: {BUSINESS_INFO.phone} — {BUSINESS_INFO.city}</div>
      </div>

      <Divider />

      {/* Número y fecha */}
      <div style={{ textAlign: 'center', margin: '6px 0' }}>
        <div style={{ fontSize: '13px', fontWeight: 900 }}>
          RECIBO DE VENTA #{String(order.orderNumber).padStart(4, '0')}
        </div>
        <div style={{ fontSize: '9.5px', marginTop: '2px', fontWeight: 700 }}>
          {formatDate(order.billedAt)}
        </div>
      </div>

      <Divider />

      {/* Datos vehículo / cliente */}
      <div style={{ margin: '6px 0', fontSize: '10px' }}>
        <Row label="Placa" value={order.vehicle.plate} />
        {vehicleDesc && <Row label="Vehículo" value={vehicleDesc} />}
        <Row label="Cliente" value={customerName} />
        {cc && <Row label="CC" value={cc} />}
        {order.vehicle.customer?.phone && <Row label="Teléfono" value={order.vehicle.customer.phone} />}
        <Row label="Técnico" value={order.technician?.name || 'N/A'} />
        {order.admin && <Row label="Cajero" value={order.admin.name} />}
      </div>

      <Divider />

      {/* Servicios */}
      {order.services.length > 0 && (
        <div style={{ margin: '6px 0' }}>
          <div style={{ fontSize: '10px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}>
            Servicios
          </div>
          {order.services.map((s) => (
            <div key={s.id} style={{ fontSize: '10px', padding: '2px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                <span style={{ flex: 1, fontWeight: 700, wordBreak: 'break-word' }}>- {s.service.name}</span>
                <span style={{ fontWeight: 900, flexShrink: 0 }}>{formatCurrency(s.chargedPrice)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Productos */}
      {order.products.length > 0 && (
        <div style={{ margin: '6px 0' }}>
          <div style={{ fontSize: '10px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}>
            Repuestos / Productos
          </div>
          {order.products.map((p) => {
            const unitPrice = Number(p.unitPrice);
            const qty = Number(p.quantity);
            const ivaRate = p.product?.iva ? Number(p.product.iva) / 100 : 0;
            const base = ivaRate > 0 ? unitPrice / (1 + ivaRate) : unitPrice;
            const ivaUnitAmt = unitPrice - base;
            return (
              <div key={p.id} style={{ fontSize: '10px', padding: '2px 0', marginBottom: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                  <span style={{ flex: 1, fontWeight: 700, wordBreak: 'break-word' }}>- {p.product.name}</span>
                  <span style={{ fontWeight: 900, flexShrink: 0 }}>{formatCurrency(qty * unitPrice)}</span>
                </div>
                <div style={{ fontSize: '9.5px', fontWeight: 700, paddingLeft: '8px', marginTop: '1px' }}>
                  {qty} und{qty !== 1 ? 's' : ''} x {formatCurrency(unitPrice)}
                  {ivaRate > 0 && ` | Base: ${formatCurrency(base)} + IVA(${Number(p.product.iva)}%): ${formatCurrency(ivaUnitAmt)}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Divider />

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
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '14px', fontWeight: 900,
          marginTop: '6px', padding: '4px 0', borderTop: '2px solid #000',
        }}>
          <span>TOTAL</span>
          <span>{formatCurrency(order.grandTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px', fontWeight: 700 }}>
          <span>Método de Pago</span>
          <span>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
        </div>
      </div>

      <Divider />

      {/* Footer */}
      <div style={{ textAlign: 'center', margin: '8px 0 4px', fontSize: '9.5px', fontWeight: 700 }}>
        {order.admin && <div>Atendido por: {order.admin.name}</div>}
        <div style={{ marginTop: '6px', fontSize: '9.5px', fontWeight: 900 }}>{BUSINESS_INFO.tagline}</div>
      </div>
    </div>
  );
}

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
