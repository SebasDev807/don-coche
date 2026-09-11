'use client';

import { AlmacenProduct } from '@/actions/almacen/almacen.actions';
import { PaymentMethod } from '@prisma/client';

interface SaleCartProps {
  cart: Map<string, number>;
  products: AlmacenProduct[];
  paymentMethod: PaymentMethod;
  onPaymentChange: (m: PaymentMethod) => void;
  onChangeQty: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onSell: (emitirFactura: boolean) => void;
  isSubmitting: boolean;
  customerName: string;
  onCustomerNameChange: (v: string) => void;
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: 'payments' },
  { value: 'TARJETA', label: 'Tarjeta', icon: 'credit_card' },
  { value: 'TRANSFERENCIA', label: 'Transf.', icon: 'account_balance' },
];

export function SaleCart({
  cart,
  products,
  paymentMethod,
  onPaymentChange,
  onChangeQty,
  onRemove,
  onSell,
  isSubmitting,
  customerName,
  onCustomerNameChange,
}: SaleCartProps) {
  const cartItems = Array.from(cart.entries()).map(([productId, qty]) => {
    const product = products.find((p) => p.id === productId)!;
    const lineSubtotal = product.salePrice * qty;
    const lineIva = (lineSubtotal * product.iva) / 100;
    return { product, qty, lineSubtotal, lineIva };
  });

  const subtotal = cartItems.reduce((acc, i) => acc + i.lineSubtotal, 0);
  const ivaTotal = cartItems.reduce((acc, i) => acc + i.lineIva, 0);
  const grandTotal = subtotal + ivaTotal;

  const isEmpty = cartItems.length === 0;

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant bg-surface-container flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">shopping_cart</span>
        <h2 className="font-bold text-on-surface">Carrito</h2>
        {!isEmpty && (
          <span className="ml-auto bg-primary text-on-primary text-xs font-bold px-2 py-0.5 rounded-full">
            {cartItems.reduce((a, i) => a + i.qty, 0)} ítem(s)
          </span>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-32 text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl mb-2">shopping_cart</span>
            <p className="text-sm text-center">Selecciona productos del catálogo</p>
          </div>
        ) : (
          cartItems.map(({ product, qty, lineSubtotal, lineIva }) => (
            <div
              key={product.id}
              className="bg-surface p-3 rounded-lg border border-outline-variant"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-on-surface truncate">{product.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    ${product.salePrice.toLocaleString('es-CO')} c/u
                    {product.iva > 0 && ` + IVA ${product.iva}%`}
                  </p>
                </div>
                <button
                  onClick={() => onRemove(product.id)}
                  className="text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="flex items-center justify-between mt-2">
                {/* Qty controls */}
                <div className="flex items-center gap-1 bg-surface-container rounded-lg overflow-hidden border border-outline-variant">
                  <button
                    onClick={() => onChangeQty(product.id, -1)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-on-surface">{qty}</span>
                  <button
                    onClick={() => onChangeQty(product.id, 1)}
                    disabled={qty >= product.stock}
                    className="w-7 h-7 flex items-center justify-center hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>

                {/* Line total */}
                <div className="text-right">
                  <p className="font-bold text-sm text-on-surface">
                    ${lineSubtotal.toLocaleString('es-CO')}
                  </p>
                  {lineIva > 0 && (
                    <p className="text-[10px] text-on-surface-variant">
                      + ${lineIva.toLocaleString('es-CO')} IVA
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer: totales + acciones */}
      <div className="border-t border-outline-variant p-4 space-y-4 bg-surface-container-highest">
        {/* Cliente opcional */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
            Cliente (Opcional)
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Consumidor Final"
            className="w-full h-9 px-3 rounded-lg border border-outline-variant bg-surface text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        {/* Método de pago */}
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Método de Pago
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onPaymentChange(opt.value)}
                className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === opt.value
                    ? 'bg-primary text-on-primary shadow'
                    : 'bg-surface text-on-surface border border-outline-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen de totales */}
        {!isEmpty && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal</span>
              <span className="font-medium">${subtotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>IVA</span>
              <span className="font-medium">${ivaTotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between font-black text-base text-on-surface pt-2 border-t border-outline-variant">
              <span>TOTAL</span>
              <span className="text-primary">${grandTotal.toLocaleString('es-CO')}</span>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="space-y-2">
          <button
            onClick={() => onSell(false)}
            disabled={isSubmitting || isEmpty}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container text-on-surface font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">receipt</span>
            Generar Recibo POS
          </button>
          <button
            onClick={() => onSell(true)}
            disabled={isSubmitting || isEmpty}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Factura Electrónica DIAN
          </button>
        </div>
      </div>
    </div>
  );
}
