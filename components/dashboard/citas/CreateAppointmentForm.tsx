'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { appointmentSchema, type AppointmentFormValues } from '@/validation';
import { createAppointment, getBookedSlots } from '@/actions/appointments';
import { CustomerSearchBar, type CustomerSuggestion, type VehicleInfo } from '@/components/tecnico/CustomerSearchBar';
import { VehicleSelector } from '@/components/tecnico/VehicleSelector';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { BUSINESS_HOURS } from '@/constants/business';

const MySwal = withReactContent(Swal);

// -----------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------

/**
 * Genera los slots de hora disponibles según el horario laboral configurado.
 * @returns Array de horas en formato 24h (ej: [8, 9, 10, ..., 18]).
 */
function generateTimeSlots(): number[] {
  const slots: number[] = [];
  for (let h = BUSINESS_HOURS.openHour; h < BUSINESS_HOURS.closeHour; h++) {
    slots.push(h);
  }
  return slots;
}

/**
 * Formatea una hora en formato 24h a texto legible (ej: 8 → "8:00 AM").
 * @param hour - Hora en formato 24h.
 * @returns String con la hora formateada.
 */
function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${suffix}`;
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD (zona local).
 */
function getTodayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Nombres de los días de la semana en español.
 */
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// -----------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// -----------------------------------------------------------------------

/**
 * Formulario de agendamiento de citas con react-hook-form + Zod.
 *
 * Reutiliza `CustomerSearchBar` y `VehicleSelector` de `components/tecnico/`
 * para la búsqueda de cliente existente y selección de vehículo.
 *
 * El selector de hora es un grid visual de botones que:
 * - Muestra todas las horas dentro del horario laboral
 * - Deshabilita horas ya ocupadas por otras citas pendientes
 * - Deshabilita domingos en el selector de fecha
 * - Resalta la hora seleccionada
 *
 * @returns {JSX.Element} Formulario de agendamiento completo.
 */
export function CreateAppointmentForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para los componentes de búsqueda (fuera de react-hook-form)
  const [customerVehicles, setCustomerVehicles] = useState<VehicleInfo[]>([]);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
  const [selectedVehicleLabel, setSelectedVehicleLabel] = useState('');

  // Estado para el selector de hora
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [bookedHours, setBookedHours] = useState<number[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const timeSlots = generateTimeSlots();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    clearErrors,
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

  // -----------------------------------------------------------------------
  // Handlers de búsqueda de cliente
  // -----------------------------------------------------------------------

  /**
   * Callback cuando se selecciona un cliente desde el `CustomerSearchBar`.
   * Establece el customerId en el form y almacena sus vehículos.
   */
  const handleSelectCustomer = useCallback(
    (customer: CustomerSuggestion) => {
      setValue('customerId', customer.id, { shouldValidate: true });
      setSelectedCustomerLabel(`${customer.cc} — ${customer.name || 'Sin nombre'}`);
      setCustomerVehicles(customer.vehicles || []);
      // Limpiar vehículo previo
      setValue('vehicleId', '');
      setSelectedVehicleLabel('');
    },
    [setValue]
  );

  /**
   * Callback cuando se selecciona un vehículo desde el `VehicleSelector`.
   */
  const handleSelectVehicle = useCallback(
    (vehicle: VehicleInfo) => {
      setValue('vehicleId', vehicle.id, { shouldValidate: true });
      setSelectedVehicleLabel(
        [vehicle.plate, vehicle.brand, vehicle.model].filter(Boolean).join(' — ')
      );
    },
    [setValue]
  );

  const handleClearCustomer = useCallback(() => {
    setValue('customerId', '');
    setValue('vehicleId', '');
    setSelectedCustomerLabel('');
    setCustomerVehicles([]);
    setSelectedVehicleLabel('');
  }, [setValue]);

  const handleClearVehicle = useCallback(() => {
    setValue('vehicleId', '');
    setSelectedVehicleLabel('');
  }, [setValue]);

  // -----------------------------------------------------------------------
  // Selector de fecha y hora
  // -----------------------------------------------------------------------

  /**
   * Al cambiar la fecha, consulta las horas ocupadas y resetea la hora seleccionada.
   */
  const handleDateChange = useCallback(
    async (dateStr: string) => {
      setSelectedDate(dateStr);
      setSelectedHour(null);
      setValue('scheduledAt', '');

      if (!dateStr) {
        setBookedHours([]);
        return;
      }

      // Validar que no sea domingo
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

      // Consultar horas ocupadas
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

  /**
   * Al seleccionar una hora, combina la fecha + hora y actualiza el form.
   */
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

  /**
   * Determina si una hora está en el pasado para el día de hoy.
   */
  const isHourInPast = useCallback(
    (hour: number): boolean => {
      if (selectedDate !== getTodayISO()) return false;
      return hour <= new Date().getHours();
    },
    [selectedDate]
  );

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------

  const onSubmit = async (data: AppointmentFormValues) => {
    setIsSubmitting(true);

    const result = await createAppointment(data);

    setIsSubmitting(false);

    if (result.success) {
      MySwal.fire({
        title: '¡Cita Agendada!',
        text: result.message,
        icon: 'success',
        confirmButtonColor: 'rgba(221, 213, 51, 1)',
        customClass: { confirmButton: '!text-black' },
      }).then(() => {
        router.push('/citas');
      });
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

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-6 md:p-8">
      <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
        {/* ─── Sección 1: Cliente ─── */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Buscar Cliente */}
            <div className="md:col-span-2">
              <CustomerSearchBar onSelectCustomer={handleSelectCustomer} onClear={handleClearCustomer} />
              {/* Campo oculto para validación */}
              <input type="hidden" {...register('customerId')} />
              <ErrorMessage message={errors.customerId?.message} />
            </div>

            {/* Seleccionar Vehículo */}
            {customerVehicles.length > 0 && (
              <div className="md:col-span-2">
                <VehicleSelector
                  vehicles={customerVehicles}
                  onSelectVehicle={handleSelectVehicle}
                  onClear={handleClearVehicle}
                />
                <input type="hidden" {...register('vehicleId')} />
                <ErrorMessage message={errors.vehicleId?.message} />
              </div>
            )}

            {customerVehicles.length === 0 && selectedCustomerLabel && (
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg py-3 px-4 text-amber-700">
                  <span className="material-symbols-outlined text-lg">warning</span>
                  <span className="text-sm">
                    Este cliente no tiene vehículos registrados. Por favor ingrese los datos del vehículo abajo.
                  </span>
                </div>
              </div>
            )}

            {/* Formulario Cliente/Vehículo Nuevo (visible si no hay cliente seleccionado o si no tiene vehículos) */}
            {(!selectedCustomerLabel || (selectedCustomerLabel && customerVehicles.length === 0)) && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-2 p-6 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
                
                {!selectedCustomerLabel && (
                  <>
                    <div className="md:col-span-2">
                      <h3 className="font-label-bold text-label-bold text-on-surface mb-2 border-b border-outline-variant/50 pb-2">O ingrese datos de un cliente nuevo</h3>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Cédula</label>
                      <input 
                        {...register('customerCc')}
                        className={`h-[48px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary px-4 ${errors.customerCc ? 'border-error' : ''}`}
                        placeholder="Ej: 1700000000" 
                        type="text" 
                      />
                      <ErrorMessage message={errors.customerCc?.message} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Nombre Completo</label>
                      <input 
                        {...register('customerName')}
                        className={`h-[48px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary px-4 ${errors.customerName ? 'border-error' : ''}`}
                        placeholder="Nombres y Apellidos" 
                        type="text" 
                      />
                      <ErrorMessage message={errors.customerName?.message} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Celular (Opcional)</label>
                      <input 
                        {...register('customerPhone')}
                        className={`h-[48px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary px-4 ${errors.customerPhone ? 'border-error' : ''}`}
                        placeholder="099 000 0000" 
                        type="tel" 
                      />
                      <ErrorMessage message={errors.customerPhone?.message} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Correo (Opcional)</label>
                      <input 
                        {...register('customerEmail')}
                        className={`h-[48px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary px-4 ${errors.customerEmail ? 'border-error' : ''}`}
                        placeholder="correo@ejemplo.com" 
                        type="email" 
                      />
                      <ErrorMessage message={errors.customerEmail?.message} />
                    </div>
                  </>
                )}

                <div className="md:col-span-2 mt-4">
                  <h3 className="font-label-bold text-label-bold text-on-surface mb-2 border-b border-outline-variant/50 pb-2">Datos del Vehículo</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Placa</label>
                  <input 
                    {...register('carPlate')}
                    className={`h-[48px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary px-4 uppercase ${errors.carPlate ? 'border-error' : ''}`}
                    placeholder="ABC-1234" 
                    type="text" 
                  />
                  <ErrorMessage message={errors.carPlate?.message} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Marca (Opcional)</label>
                  <input 
                    {...register('carBrand')}
                    className={`h-[48px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary px-4 ${errors.carBrand ? 'border-error' : ''}`}
                    placeholder="Ej: Toyota" 
                    type="text" 
                  />
                  <ErrorMessage message={errors.carBrand?.message} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Modelo (Opcional)</label>
                  <input 
                    {...register('carModel')}
                    className={`h-[48px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary px-4 ${errors.carModel ? 'border-error' : ''}`}
                    placeholder="Ej: Corolla" 
                    type="text" 
                  />
                  <ErrorMessage message={errors.carModel?.message} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Color (Opcional)</label>
                  <input 
                    {...register('carColor')}
                    className={`h-[48px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary px-4 ${errors.carColor ? 'border-error' : ''}`}
                    placeholder="Ej: Rojo" 
                    type="text" 
                  />
                  <ErrorMessage message={errors.carColor?.message} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Divider */}
        <hr className="border-outline-variant/50 border-t" />

        {/* ─── Sección 2: Fecha y Hora ─── */}
        <section>
          <div className="space-y-5">
            {/* Selector de Fecha */}
            <div>
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">
                Fecha de la cita
              </label>
              <input
                id="appointment-date"
                type="date"
                min={getTodayISO()}
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="h-[56px] form-input w-full max-w-sm rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface cursor-pointer"
              />
              <p className="text-xs text-secondary mt-1.5">
                <span className="material-symbols-outlined text-[14px] align-middle mr-0.5">
                  info
                </span>
                Horario: Lunes a Sábado, {BUSINESS_HOURS.openHour}:00 AM a{' '}
                {BUSINESS_HOURS.closeHour > 12
                  ? `${BUSINESS_HOURS.closeHour - 12}:00 PM`
                  : `${BUSINESS_HOURS.closeHour}:00 AM`}
                . No se atiende los Domingos.
              </p>
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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
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
                          relative h-14 rounded-lg border-2 font-medium text-sm transition-all cursor-pointer
                          flex flex-col items-center justify-center gap-0.5
                          ${
                            isSelected
                              ? 'border-primary bg-primary-container text-on-primary-container ring-2 ring-primary/30 scale-[1.02]'
                              : isDisabled
                                ? 'border-outline-variant/50 bg-surface-container text-secondary/50 cursor-not-allowed'
                                : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary hover:bg-primary-container/20 active:scale-95'
                          }
                        `}
                      >
                        <span>{formatHour(hour)}</span>
                        {isBooked && (
                          <span className="text-[10px] text-error font-semibold uppercase tracking-wider">
                            Ocupado
                          </span>
                        )}
                        {isPast && !isBooked && (
                          <span className="text-[10px] text-secondary font-medium">Pasada</span>
                        )}
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[12px]">
                              check
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <ErrorMessage message={errors.scheduledAt?.message} />
              </div>
            )}
          </div>
        </section>

        {/* Divider */}
        <hr className="border-outline-variant/50 border-t" />

        {/* ─── Sección 3: Detalles ─── */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">
                Descripción / Motivo
                <span className="text-secondary font-normal text-xs ml-1">(Opcional)</span>
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Ej: Cambio de aceite, revisión de frenos, lavado general..."
                className={`form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 py-3 text-on-surface placeholder:text-secondary-fixed-dim resize-none ${
                  errors.description ? 'border-error focus:border-error focus:ring-error' : ''
                }`}
              />
              <ErrorMessage message={errors.description?.message} />
            </div>

            {/* Notas */}
            <div className="md:col-span-2">
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">
                Notas Adicionales
                <span className="text-secondary font-normal text-xs ml-1">(Opcional)</span>
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Ej: El cliente confirmó por WhatsApp, traer repuesto..."
                className="form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 py-3 text-on-surface placeholder:text-secondary-fixed-dim resize-none"
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-outline-variant/50 border-t" />

        {/* ─── Resumen rápido ─── */}
        {selectedCustomerLabel && selectedDate && selectedHour !== null && (
          <div className="bg-primary-container/10 border border-primary-container/40 rounded-xl p-5">
            <h3 className="font-label-bold text-label-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">summarize</span>
              Resumen de la cita
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  person
                </span>
                <span className="text-on-surface">{selectedCustomerLabel}</span>
              </div>
              {selectedVehicleLabel && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">
                    directions_car
                  </span>
                  <span className="text-on-surface">{selectedVehicleLabel}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  schedule
                </span>
                <span className="text-on-surface">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CO', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  a las {formatHour(selectedHour)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Botones ─── */}
        <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/citas')}
            className="cursor-pointer w-full sm:w-auto h-[56px] px-8 rounded-full border-2 border-outline-variant text-secondary font-cta text-cta hover:bg-surface-container-high transition-colors focus:ring-2 focus:ring-outline focus:outline-none"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="cursor-pointer w-full sm:w-auto h-[56px] px-8 rounded-full bg-primary-container text-on-primary-container font-cta text-cta hover:bg-primary-fixed-dim transition-all shadow-sm active:scale-95 duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined">calendar_add_on</span>
            )}
            Agendar Cita
          </button>
        </div>
      </form>
    </div>
  );
}
