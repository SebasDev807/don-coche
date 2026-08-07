'use client';

import { useState } from 'react';
import { setNextMaintenance } from '@/actions/orders/core.actions';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

function getTodayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function calculateFutureDateISO(daysToAdd: number): string {
  const future = new Date();
  future.setDate(future.getDate() + daysToAdd);
  return `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
}

interface NextAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  vehicleId: string;
  customerName: string;
  vehiclePlate: string;
  orderId: string;
}

export function NextAppointmentModal({
  isOpen,
  onClose,
  customerName,
  vehiclePlate,
  orderId
}: NextAppointmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('El motivo es obligatorio');
      return;
    }
    setError('');

    setIsSubmitting(true);
    const result = await setNextMaintenance(orderId, selectedDate, reason);
    setIsSubmitting(false);

    if (result.success) {
      MySwal.fire({
        toast: true,
        position: 'top-end',
        title: '¡Recomendación guardada!',
        text: 'Se enviará en el mensaje automático al facturar.',
        icon: 'success',
        showConfirmButton: false,
        timer: 3000
      });
      // Reset state and close
      setReason('');
      setSelectedDate('');
      onClose();
    } else {
      MySwal.fire({
        title: 'Error',
        text: result.message,
        icon: 'error',
        confirmButtonColor: 'rgba(221, 213, 51, 1)',
        customClass: { confirmButton: '!text-black' },
      });
    }
  };

  const handleSkip = () => {
    setReason('');
    setSelectedDate('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex items-start justify-between sticky top-0 bg-surface z-10">
          <div>
            <h2 className="text-xl font-headline-bold text-on-surface mb-1">Próximo Mantenimiento Recomendado</h2>
            <p className="text-sm text-secondary">
              Cliente: {customerName} | Placa: {vehiclePlate}
            </p>
          </div>
          <button 
            onClick={handleSkip}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form id="next-maintenance-form" onSubmit={onSubmit} className="space-y-6">
            
            {/* Motivo */}
            <div>
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">
                Motivo del próximo servicio <span className="text-error">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.trim()) setError('');
                }}
                rows={2}
                placeholder="Ej: Cambio de aceite, Próximo lavado..."
                className={`form-input w-full rounded-lg border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 py-3 text-on-surface resize-none ${
                  error ? 'border-error focus:border-error focus:ring-error' : ''
                }`}
              />
              {error && <ErrorMessage message={error} />}
            </div>

            <hr className="border-outline-variant/50 border-t" />

            {/* Fecha */}
            <div>
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">
                Fecha sugerida
              </label>
              
              {/* Botones de acceso rápido */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedDate(calculateFutureDateISO(7))}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-surface-variant text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors"
                >
                  En 1 semana
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(calculateFutureDateISO(15))}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-surface-variant text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors"
                >
                  En 15 días
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(calculateFutureDateISO(30))}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-surface-variant text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors"
                >
                  En 1 mes
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(calculateFutureDateISO(90))}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-surface-variant text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors"
                >
                  En 3 meses
                </button>
              </div>

              <input
                type="date"
                min={getTodayISO()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-[56px] form-input w-full max-w-sm rounded-lg border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface cursor-pointer"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-end gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="h-[48px] px-6 rounded-full font-cta text-sm text-secondary hover:bg-surface-variant transition-colors"
          >
            Omitir
          </button>
          <button
            type="submit"
            form="next-maintenance-form"
            disabled={isSubmitting || !selectedDate}
            className="h-[48px] px-8 rounded-full bg-primary-container text-on-primary-container font-cta text-sm hover:bg-primary-fixed-dim transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">save</span>
            )}
            Guardar Recomendación
          </button>
        </div>
      </div>
    </div>
  );
}
