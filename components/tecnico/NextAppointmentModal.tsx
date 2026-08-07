'use client';

import { useState, useEffect } from 'react';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

function getTodayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function calculateFutureDateISO(daysToAdd: number): string {
  const future = new Date();
  future.setDate(future.getDate() + daysToAdd);
  return `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
}

const SERVITECA_REASONS = [
  'Cambio de aceite',
  'Alineación y balanceo',
  'Revisión de frenos',
  'Mantenimiento general',
  'Cambio de llantas'
];

const LAVADERO_REASONS = [
  'Lavado general',
  'Polichado',
  'Desinfección',
  'Lavado de motor',
  'Limpieza de cojinería'
];

const DEFAULT_REASONS = [
  'Mantenimiento general',
  'Próximo servicio',
  'Revisión preventiva'
];

interface NextAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitOrder: (date: string, reason: string) => void;
  department?: string | null;
  customerName?: string;
  vehiclePlate?: string;
  isSubmitting?: boolean;
}

export function NextAppointmentModal({
  isOpen,
  onClose,
  onSubmitOrder,
  department,
  customerName,
  vehiclePlate,
  isSubmitting = false
}: NextAppointmentModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isCustomReason, setIsCustomReason] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate('');
      setReason('');
      setCustomReason('');
      setIsCustomReason(false);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = isCustomReason ? customReason : reason;

    if (!finalReason.trim()) {
      setError('El motivo es obligatorio');
      return;
    }
    setError('');

    // Si no selecciona fecha, se enviará string vacío
    onSubmitOrder(selectedDate, finalReason);
  };

  const handleSkip = () => {
    onSubmitOrder('', '');
  };

  const predefinedReasons = department === 'Serviteca'
    ? SERVITECA_REASONS
    : department === 'Lavadero'
      ? LAVADERO_REASONS
      : DEFAULT_REASONS;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex items-start justify-between sticky top-0 bg-surface z-10">
          <div>
            <h2 className="text-2xl font-headline-bold text-on-surface mb-1">Próximo Servicio Recomendado</h2>
            <p className="text-base text-secondary">
              Cliente: {customerName || 'N/A'} | Placa: {vehiclePlate || 'N/A'}
            </p>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-2xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form id="next-maintenance-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Motivo */}
            <div>
              <label className="block text-lg font-label-bold text-on-surface-variant mb-4">
                Motivo del próximo servicio <span className="text-error">*</span>
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {predefinedReasons.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setReason(r);
                      setIsCustomReason(false);
                      setError('');
                    }}
                    className={`p-4 rounded-xl text-sm font-medium border-2 transition-all ${
                      !isCustomReason && reason === r
                        ? 'border-primary bg-primary-container text-on-primary-container'
                        : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-variant text-on-surface'
                    }`}
                  >
                    {r}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsCustomReason(true)}
                  className={`p-4 rounded-xl text-sm font-medium border-2 transition-all ${
                    isCustomReason
                      ? 'border-primary bg-primary-container text-on-primary-container'
                      : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-variant text-on-surface'
                  }`}
                >
                  Otro motivo...
                </button>
              </div>

              {isCustomReason && (
                <textarea
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    if (e.target.value.trim()) setError('');
                  }}
                  rows={2}
                  placeholder="Escribe el motivo..."
                  className={`form-input text-lg w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-6 py-4 text-on-surface resize-none ${
                    error ? 'border-error focus:border-error focus:ring-error' : ''
                  }`}
                />
              )}
              {error && <div className="mt-2"><ErrorMessage message={error} /></div>}
            </div>

            <hr className="border-outline-variant/50 border-t" />

            {/* Fecha */}
            <div>
              <label className="block text-lg font-label-bold text-on-surface-variant mb-4">
                Fecha sugerida
              </label>
              
              {/* Botones de acceso rápido para tablets */}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: '1 semana', days: 7 },
                  { label: '15 días', days: 15 },
                  { label: '1 mes', days: 30 },
                  { label: '2 meses', days: 60 },
                  { label: '3 meses', days: 90 },
                  { label: '4 meses', days: 120 },
                  { label: '6 meses', days: 180 },
                ].map(time => {
                  const dateVal = calculateFutureDateISO(time.days);
                  return (
                    <button
                      key={time.days}
                      type="button"
                      onClick={() => setSelectedDate(dateVal)}
                      className={`p-4 rounded-xl text-sm font-medium border-2 transition-all ${
                        selectedDate === dateVal
                          ? 'border-primary bg-primary-container text-on-primary-container'
                          : 'border-outline-variant bg-surface-variant hover:bg-primary-container hover:text-on-primary-container text-on-surface-variant'
                      }`}
                    >
                      En {time.label}
                    </button>
                  );
                })}
              </div>

              <input
                type="date"
                min={getTodayISO()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-[64px] text-lg form-input w-full md:w-1/2 rounded-xl border-2 border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-6 text-on-surface cursor-pointer"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-end gap-4 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-[56px] px-8 rounded-full font-cta text-base text-secondary hover:bg-surface-variant transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="next-maintenance-form"
            disabled={isSubmitting || !(isCustomReason ? customReason.trim() : reason.trim())}
            className="h-[56px] px-10 rounded-full bg-primary-container text-on-primary-container font-cta text-base hover:bg-primary-fixed-dim transition-all shadow-sm flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined animate-spin text-[24px]">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-[24px]">save</span>
            )}
            Guardar Recomendación
          </button>
        </div>
      </div>
    </div>
  );
}
