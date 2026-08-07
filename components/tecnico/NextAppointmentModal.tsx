'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentSchema, type AppointmentFormValues } from '@/validation';
import { createAppointment, getBookedSlots } from '@/actions/appointments';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { BUSINESS_HOURS } from '@/constants/business';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

function generateTimeSlots(): number[] {
  const slots: number[] = [];
  for (let h = BUSINESS_HOURS.openHour; h < BUSINESS_HOURS.closeHour; h++) {
    slots.push(h);
  }
  return slots;
}

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${suffix}`;
}

function getTodayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface NextAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  vehicleId: string;
  customerName: string;
  vehiclePlate: string;
}

export function NextAppointmentModal({
  isOpen,
  onClose,
  customerId,
  vehicleId,
  customerName,
  vehiclePlate
}: NextAppointmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [bookedHours, setBookedHours] = useState<number[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const timeSlots = generateTimeSlots();

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
    reset
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customerId: '',
      vehicleId: '',
      scheduledAt: '',
      description: '',
      notes: '',
    },
  });

  // Prefill customer and vehicle data when modal opens
  useEffect(() => {
    if (isOpen) {
      setValue('customerId', customerId);
      setValue('vehicleId', vehicleId);
    }
  }, [isOpen, customerId, vehicleId, setValue]);

  const handleDateChange = useCallback(
    async (dateStr: string) => {
      setSelectedDate(dateStr);
      setSelectedHour(null);
      setValue('scheduledAt', '');

      if (!dateStr) {
        setBookedHours([]);
        return;
      }

      const date = new Date(dateStr + 'T12:00:00');
      if (BUSINESS_HOURS.closedDays.includes(date.getDay())) {
        MySwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: `Los ${DAY_NAMES[date.getDay()]} no hay servicio`,
          showConfirmButton: false,
          timer: 3000,
        });
        setSelectedDate('');
        setBookedHours([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const res = await getBookedSlots(dateStr);
        if (res.success) {
          setBookedHours(res.data);
        }
      } catch (error) {
        console.error('Error loading booked slots:', error);
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [setValue]
  );

  const handleHourSelect = useCallback(
    (hour: number) => {
      setSelectedHour(hour);
      if (selectedDate) {
        const isoDateTime = `${selectedDate}T${String(hour).padStart(2, '0')}:00:00`;
        setValue('scheduledAt', isoDateTime, { shouldValidate: true });
        clearErrors('scheduledAt');
      }
    },
    [selectedDate, setValue, clearErrors]
  );

  const isHourInPast = useCallback(
    (hour: number): boolean => {
      if (selectedDate !== getTodayISO()) return false;
      return hour <= new Date().getHours();
    },
    [selectedDate]
  );

  const onSubmit = async (data: AppointmentFormValues) => {
    setIsSubmitting(true);
    const result = await createAppointment(data);
    setIsSubmitting(false);

    if (result.success) {
      MySwal.fire({
        toast: true,
        position: 'top-end',
        title: '¡Cita Agendada!',
        text: 'Se enviará notificación automática al facturar.',
        icon: 'success',
        showConfirmButton: false,
        timer: 3000
      });
      // Reset state and close
      reset();
      setSelectedDate('');
      setSelectedHour(null);
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
    reset();
    setSelectedDate('');
    setSelectedHour(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex items-start justify-between sticky top-0 bg-surface z-10">
          <div>
            <h2 className="text-xl font-headline-bold text-on-surface mb-1">Agendar Próximo Servicio</h2>
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
          <form id="next-appointment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...register('customerId')} />
            <input type="hidden" {...register('vehicleId')} />

            {/* Motivo */}
            <div>
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">
                Motivo del próximo servicio <span className="text-error">*</span>
              </label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Ej: Cambio de aceite, Próximo lavado..."
                className={`form-input w-full rounded-lg border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 py-3 text-on-surface resize-none ${
                  errors.description ? 'border-error focus:border-error focus:ring-error' : ''
                }`}
              />
              <ErrorMessage message={errors.description?.message} />
            </div>

            <hr className="border-outline-variant/50 border-t" />

            {/* Fecha */}
            <div>
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">
                Fecha sugerida
              </label>
              <input
                type="date"
                min={getTodayISO()}
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="h-[56px] form-input w-full max-w-sm rounded-lg border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface cursor-pointer"
              />
            </div>

            {/* Grid de Horas */}
            {selectedDate && (
              <div>
                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-3">
                  Hora disponible
                  {isLoadingSlots && (
                    <span className="ml-2 inline-flex items-center text-xs font-normal text-secondary">
                      <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1" />
                      Cargando...
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {timeSlots.map((hour) => {
                    const isBooked = bookedHours.includes(hour);
                    const isPast = isHourInPast(hour);
                    const isSelected = selectedHour === hour;
                    const isDisabled = isBooked || isPast;

                    return (
                      <button
                        key={hour}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleHourSelect(hour)}
                        className={`
                          relative h-12 rounded-lg border font-medium text-xs transition-all cursor-pointer flex flex-col items-center justify-center
                          ${isSelected ? 'border-primary bg-primary-container text-on-primary-container ring-1 ring-primary/30' : 
                            isDisabled ? 'border-outline-variant/50 bg-surface-container text-secondary/50 cursor-not-allowed' : 
                            'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary'}
                        `}
                      >
                        <span>{formatHour(hour)}</span>
                        {isBooked && (
                          <span className="text-[9px] text-error font-semibold uppercase">
                            Ocupado
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <ErrorMessage message={errors.scheduledAt?.message} />
              </div>
            )}
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
            form="next-appointment-form"
            disabled={isSubmitting || !selectedDate || selectedHour === null}
            className="h-[48px] px-8 rounded-full bg-primary-container text-on-primary-container font-cta text-sm hover:bg-primary-fixed-dim transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
            )}
            Agendar
          </button>
        </div>
      </div>
    </div>
  );
}
