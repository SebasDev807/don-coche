'use client';

import { useState } from 'react';
import { PaymentMethod } from '@prisma/client';
import { createManualInvoice } from '@/actions/caja/manualInvoice.actions';
import { useRouter } from 'next/navigation';
import { ReceiptModal } from './ReceiptModal';

interface ManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderData: any) => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: 'payments' },
  { value: 'TARJETA', label: 'Tarjeta', icon: 'credit_card' },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: 'account_balance' },
];

export function ManualInvoiceModal({ isOpen, onClose, onSuccess }: ManualInvoiceModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [plate, setPlate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [includeIva, setIncludeIva] = useState(false);
  const [ivaRate, setIvaRate] = useState('19');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setAmount('');
    setDescription('');
    setCustomerName('');
    setPlate('');
    setPaymentMethod('EFECTIVO');
    setIncludeIva(false);
    setIvaRate('19');
    setError('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = Number(amount.replace(/\D/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      setError('Ingresa un monto válido mayor a cero.');
      return;
    }
    
    const finalIvaRate = includeIva ? Number(ivaRate) || 0 : 0;

    setIsSubmitting(true);
    const result = await createManualInvoice({
      amount: numericAmount,
      description: description.trim(),
      paymentMethod,
      customerName: customerName.trim() || undefined,
      ivaRate: finalIvaRate,
      plate: plate.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      // Disparamos éxito pasando la orden para imprimir, y cerramos el modal
      onSuccess({
        isManualInvoice: true,
        orderNumber: result.saleNumber,
        billedAt: new Date(),
        paymentMethod,
        totalServices: 0,
        totalProducts: numericAmount,
        grandTotal: numericAmount,
        vehicle: {
          plate: plate.trim().toUpperCase() || 'N/A',
          customer: { name: customerName.trim() || 'Consumidor Final' }
        },
        technician: { name: 'Sistema' },
        admin: { name: result.adminName },
        services: [],
        products: [
          {
            id: `manual-${result.saleNumber}`,
            quantity: 1,
            unitPrice: numericAmount,
            product: { 
              name: description.trim() || 'Ingreso Personalizado', 
              iva: finalIvaRate 
            }
          }
        ]
      });
      handleClose();
      router.refresh();
    } else {
      setError(result.message || 'Error al registrar la factura.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up">

          {/* Header */}
        <div className="p-6 border-b border-surface-variant flex items-center justify-between bg-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-[20px]">add_circle</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-on-surface text-lg font-bold">Factura Manual</h2>
              <p className="text-xs text-on-surface-variant">Registro de ingreso personalizado</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

              {/* Monto */}
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">
                  Monto <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount ? Number(amount.replace(/\D/g, '')).toLocaleString() : ''}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-14 pl-8 pr-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-2 focus:ring-primary transition-all text-on-surface text-xl font-bold placeholder:text-secondary placeholder:font-normal"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">
                  Descripción <span className="text-xs font-normal text-secondary">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-2 focus:ring-primary transition-all text-on-surface"
                  placeholder="Ej: Servicio adicional, abono, recarga..."
                  maxLength={120}
                />
              </div>

              {/* Placa (opcional) */}
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">
                  Placa <span className="text-xs font-normal text-secondary">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-2 focus:ring-primary transition-all text-on-surface uppercase"
                  placeholder="Ej. ABC123"
                  maxLength={10}
                />
              </div>

              {/* Cliente (opcional) */}
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">
                  Cliente <span className="text-xs font-normal text-secondary">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-2 focus:ring-primary transition-all text-on-surface"
                  placeholder="Nombre del cliente"
                  maxLength={100}
                />
              </div>

              {/* IVA Opcional */}
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeIva}
                    onChange={(e) => setIncludeIva(e.target.checked)}
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">Incluir IVA en la factura</span>
                    <span className="text-xs text-on-surface-variant">Discriminar el impuesto sobre el valor total</span>
                  </div>
                </label>
                {includeIva && (
                  <div className="pl-8 pt-1 flex items-center gap-3 animate-fade-in">
                    <label className="text-sm font-bold text-on-surface-variant">Porcentaje:</label>
                    <div className="relative w-24">
                      <input
                        type="number"
                        value={ivaRate}
                        onChange={(e) => setIvaRate(e.target.value)}
                        className="w-full h-10 px-3 pr-8 rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface text-center font-bold"
                        min="0"
                        max="100"
                        step="1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-3">
                  Método de Pago <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 font-bold text-xs transition-all cursor-pointer border-2 ${
                        paymentMethod === pm.value
                          ? 'bg-primary text-on-primary border-primary shadow-sm'
                          : 'bg-surface-container-lowest border-outline-variant hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">{pm.icon}</span>
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-error-container text-on-error-container p-3 rounded-xl text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}

              {/* Resumen */}
              {amount && Number(amount) > 0 && (
                <div className="bg-surface-container rounded-xl p-4 flex items-center justify-between border border-outline-variant">
                  <span className="text-sm text-on-surface-variant font-medium">Total a registrar</span>
                  <span className="text-2xl font-black text-primary">
                    ${Number(amount).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-full border-2 border-outline-variant text-secondary font-bold hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !amount || Number(amount) <= 0}
                  className="flex-1 h-12 rounded-full bg-primary-container text-on-primary-container font-bold hover:bg-primary-fixed-dim transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      Registrar
                    </>
                  )}
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
}
