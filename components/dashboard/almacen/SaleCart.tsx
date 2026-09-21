'use client';

import { AlmacenProduct } from '@/actions/almacen/almacen.actions';
import { PaymentMethod } from '@prisma/client';
import { useState } from 'react';
import { CustomerSearchBar, CustomerSuggestion, VehicleInfo } from '@/components/tecnico/CustomerSearchBar';
import { VehicleSelector } from '@/components/tecnico/VehicleSelector';

interface SaleCartProps {
  cart: Map<string, number>;
  products: AlmacenProduct[];
  selectedServiceIds: Set<string>;
  services: any[];
  paymentMethod: PaymentMethod;
  onPaymentChange: (m: PaymentMethod) => void;
  onChangeQty: (productId: string, delta: number) => void;
  onRemove: (id: string, type: 'PRODUCT' | 'SERVICE') => void;
  onSell: (emitirFactura: boolean, vehicleData?: any) => void;
  onSendToCaja?: (vehicleData?: any) => void;
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
  selectedServiceIds,
  services,
  paymentMethod,
  onPaymentChange,
  onChangeQty,
  onRemove,
  onSell,
  onSendToCaja,
  isSubmitting,
  customerName,
  onCustomerNameChange,
}: SaleCartProps) {
  const [plate, setPlate] = useState('');
  const [customerCc, setCustomerCc] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerVehicles, setCustomerVehicles] = useState<VehicleInfo[]>([]);

  const handleSelectCustomer = (customer: CustomerSuggestion) => {
    onCustomerNameChange(customer.name || '');
    setCustomerCc(customer.cc || '');
    setCustomerPhone(customer.phone || '');
    setCustomerVehicles(customer.vehicles);
    if (customer.vehicles.length === 1) {
      setPlate(customer.vehicles[0].plate);
    } else {
      setPlate('');
    }
  };

  const handleClearCustomer = () => {
    onCustomerNameChange('');
    setCustomerCc('');
    setCustomerPhone('');
    setCustomerVehicles([]);
    setPlate('');
  };

  const handleSelectVehicle = (vehicle: VehicleInfo) => {
    setPlate(vehicle.plate);
  };

  const handleClearVehicle = () => {
    setPlate('');
  };
  const cartItems = Array.from(cart.entries()).map(([productId, qty]) => {
    const product = products.find((p) => p.id === productId)!;
    const lineSubtotal = product.salePrice * qty;
    const lineIva = 0; // IVA ya incluido en el precio
    return { id: product.id, name: product.name, qty, lineSubtotal, lineIva, type: 'PRODUCT' as const, product };
  });

  const serviceItems = Array.from(selectedServiceIds).map((serviceId) => {
    const service = services.find((s) => s.id === serviceId)!;
    return { id: service.id, name: service.name, qty: 1, lineSubtotal: service.pvp, lineIva: 0, type: 'SERVICE' as const, service };
  });

  const allItems = [...cartItems, ...serviceItems];

  const subtotal = allItems.reduce((acc, i) => acc + i.lineSubtotal, 0);
  const ivaTotal = allItems.reduce((acc, i) => acc + i.lineIva, 0);
  const grandTotal = subtotal + ivaTotal;

  const isEmpty = allItems.length === 0;
  const hasServices = serviceItems.length > 0;

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant bg-surface-container flex items-center gap-2 sticky top-0 z-10">
        <span className="material-symbols-outlined text-primary">shopping_cart</span>
        <h2 className="font-bold text-on-surface">Carrito</h2>
        {!isEmpty && (
          <span className="ml-auto bg-primary text-on-primary text-xs font-bold px-2 py-0.5 rounded-full">
            {allItems.reduce((a, i) => a + i.qty, 0)} ítem(s)
          </span>
        )}
      </div>

      {/* Scrollable Content (Items + Footer) */}
      <div className="flex-1 overflow-y-auto flex flex-col">

        {/* Items */}
        <div className="p-3 space-y-2 flex-1">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-32 text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl mb-2">shopping_cart</span>
              <p className="text-sm text-center">Selecciona productos o servicios</p>
            </div>
          ) : (
            allItems.map((item) => (
              <div
                key={item.id}
                className="bg-surface p-3 rounded-lg border border-outline-variant"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                      {item.type === 'SERVICE' ? 'build' : 'shopping_bag'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-on-surface truncate">{item.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        ${item.type === 'PRODUCT' ? item.product.salePrice.toLocaleString('es-CO') : item.service.pvp.toLocaleString('es-CO')} c/u
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(item.id, item.type)}
                    className="flex-shrink-0 text-on-surface-variant hover:text-error transition-colors cursor-pointer ml-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2 pl-7">
                  {/* Qty controls (solo para productos) */}
                  {item.type === 'PRODUCT' ? (
                    <div className="flex items-center gap-1 bg-surface-container rounded-lg overflow-hidden border border-outline-variant">
                      <button
                        onClick={() => onChangeQty(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-on-surface">{item.qty}</span>
                      <button
                        onClick={() => onChangeQty(item.id, 1)}
                        disabled={item.qty >= item.product.stock}
                        className="w-7 h-7 flex items-center justify-center hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-on-surface-variant">Cant: 1</div>
                  )}

                  {/* Line total */}
                  <div className="text-right">
                    <p className="font-bold text-sm text-on-surface">
                      ${item.lineSubtotal.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Footer: totales + acciones */}
        <div className="border-t border-outline-variant p-4 space-y-4 bg-surface-container-highest mt-auto">
            {/* Buscador de clientes */}
            <div className="space-y-3 p-3 bg-surface border border-outline-variant rounded-xl shadow-sm">
              <CustomerSearchBar onSelectCustomer={handleSelectCustomer} onClear={handleClearCustomer} />
              
              {hasServices && customerVehicles.length > 0 && (
                <div className="pt-2 border-t border-outline-variant">
                  <VehicleSelector vehicles={customerVehicles} onSelectVehicle={handleSelectVehicle} onClear={handleClearVehicle} />
                </div>
              )}
            </div>

            {/* Vehículo opcional para servicios (si no hay guardados) */}
            {hasServices && customerVehicles.length === 0 && (
              <div className="space-y-3 p-3 bg-surface border border-outline-variant rounded-lg">
                <p className="text-xs text-on-surface-variant font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">directions_car</span>
                  Vehículo (Opcional)
                </p>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Placa
                  </label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="Dejar en blanco si no aplica"
                    maxLength={7}
                    className="w-full h-9 px-3 rounded-lg border border-outline-variant bg-surface text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all uppercase"
                  />
                </div>
              </div>
            )}

            {/* Cliente opcional */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Nombre Cliente {hasServices ? '*' : '(Opcional)'}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  placeholder="Consumidor Final"
                  className="w-full h-9 px-3 rounded-lg border border-outline-variant bg-surface text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              {hasServices && (
                <>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      CC Cliente
                    </label>
                    <input
                      type="text"
                      value={customerCc}
                      onChange={(e) => setCustomerCc(e.target.value)}
                      placeholder="1234567890"
                      className="w-full h-9 px-3 rounded-lg border border-outline-variant bg-surface text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Teléfono Cliente
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="3001234567"
                      className="w-full h-9 px-3 rounded-lg border border-outline-variant bg-surface text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </>
              )}
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
                    className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs font-bold transition-all cursor-pointer ${paymentMethod === opt.value
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
              {/* Botón Enviar a Caja — solo cuando hay servicios */}
              {hasServices && onSendToCaja && (
                <button
                  onClick={() => onSendToCaja({ plate, customerCc, customerPhone })}
                  disabled={isSubmitting || isEmpty}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">send_to_mobile</span>
                  Enviar a Caja
                </button>
              )}
              <button
                onClick={() => onSell(false, hasServices ? { plate, customerCc, customerPhone } : undefined)}
                disabled={isSubmitting || isEmpty}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container text-on-surface font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">receipt</span>
                Generar Recibo POS
              </button>
              <button
                onClick={() => onSell(true, hasServices ? { plate, customerCc, customerPhone } : undefined)}
                disabled={isSubmitting || isEmpty}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                Factura Electrónica DIAN
              </button>
            </div>
          </div>
        </div>
      </div>
      );
}
