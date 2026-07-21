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
  product: { name: string };
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
    customer?: { name?: string | null; phone?: string | null } | null;
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
  return `$${value.toLocaleString('es-CO')}`;
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

export function PosReceipt({ order }: PosReceiptProps) {
  const customerName = order.vehicle.customer?.name || 'Consumidor Final';
  const vehicleDesc = [order.vehicle.brand, order.vehicle.model, order.vehicle.color]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      id="pos-receipt"
      style={{
        width: '302px',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '12px',
        lineHeight: '1.4',
        color: '#000',
        background: '#fff',
        padding: '12px 8px',
        margin: '0 auto',
      }}
    >
      {/* ── Header del negocio ── */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px' }}>
          {BUSINESS_INFO.name.toUpperCase()}
        </div>
        <div style={{ fontSize: '11px', marginTop: '2px' }}>{BUSINESS_INFO.legalName}</div>
        <div style={{ fontSize: '10px', marginTop: '2px', color: '#555' }}>
          NIT: {BUSINESS_INFO.nit}
        </div>
        <div style={{ fontSize: '10px', color: '#555' }}>{BUSINESS_INFO.address}</div>
        <div style={{ fontSize: '10px', color: '#555' }}>
          Tel: {BUSINESS_INFO.phone} — {BUSINESS_INFO.city}
        </div>
      </div>

      <Divider />

      {/* ── Número de recibo y fecha ── */}
      <div style={{ textAlign: 'center', margin: '6px 0' }}>
        <div style={{ fontSize: '14px', fontWeight: 700 }}>
          RECIBO DE VENTA #{String(order.orderNumber).padStart(4, '0')}
        </div>
        <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>
          {formatDate(order.billedAt)}
        </div>
      </div>

      <Divider />

      {/* ── Datos del vehículo y cliente ── */}
      <div style={{ margin: '6px 0', fontSize: '11px' }}>
        <Row label="Placa" value={order.vehicle.plate} bold />
        {vehicleDesc && <Row label="Vehículo" value={vehicleDesc} />}
        <Row label="Cliente" value={customerName} />
        <Row label="Técnico" value={order.technician.name} />
      </div>

      <Divider />

      {/* ── Servicios ── */}
      {order.services.length > 0 && (
        <div style={{ margin: '6px 0' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Servicios
          </div>
          {order.services.map((s) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '1px 0' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                {s.service.name}
              </span>
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(s.chargedPrice)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Productos ── */}
      {order.products.length > 0 && (
        <div style={{ margin: '6px 0' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Productos
          </div>
          {order.products.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '1px 0' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                {p.quantity}x {p.product.name}
              </span>
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(p.quantity * p.unitPrice)}</span>
            </div>
          ))}
        </div>
      )}

      <Divider />

      {/* ── Totales ── */}
      <div style={{ margin: '6px 0', fontSize: '11px' }}>
        {order.services.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
            <span>Subtotal Servicios</span>
            <span>{formatCurrency(order.totalServices)}</span>
          </div>
        )}
        {order.products.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
            <span>Subtotal Productos</span>
            <span>{formatCurrency(order.totalProducts)}</span>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '16px',
            fontWeight: 800,
            marginTop: '6px',
            padding: '4px 0',
            borderTop: '1px dashed #000',
          }}
        >
          <span>TOTAL</span>
          <span>{formatCurrency(order.grandTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '2px' }}>
          <span>Método de Pago</span>
          <span style={{ fontWeight: 600 }}>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
        </div>
      </div>

      <Divider />

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', margin: '8px 0 4px', fontSize: '10px', color: '#555' }}>
        {order.admin && <div>Atendido por: {order.admin.name}</div>}
        <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 600 }}>
          {BUSINESS_INFO.tagline}
        </div>
      </div>
    </div>
  );
}

/** Línea divisora punteada */
function Divider() {
  return (
    <div
      style={{
        borderTop: '1px dashed #999',
        margin: '4px 0',
      }}
    />
  );
}

/** Fila label: valor */
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
      <span style={{ color: '#555' }}>{label}:</span>
      <span style={{ fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}
