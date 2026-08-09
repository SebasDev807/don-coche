'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { publicAppointmentSchema, type PublicAppointmentSchemaType } from '@/validation/public';
import { bookAppointment } from '@/actions/public/appointment.actions';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getPublicBookedSlots } from '@/actions/public/appointment.actions';

const MySwal = withReactContent(Swal);

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export const BookingForm = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<number[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<PublicAppointmentSchemaType>({
    resolver: zodResolver(publicAppointmentSchema),
    defaultValues: {
      carColor: '',
      customerEmail: '',
    }
  });

  const onSubmit = async (data: PublicAppointmentSchemaType) => {
    setIsSubmitting(true);
    MySwal.showLoading();

    const res = await bookAppointment(data);

    setIsSubmitting(false);
    MySwal.close();

    if (res.success) {
      MySwal.fire({
        icon: 'success',
        title: '¡Cita Reservada!',
        text: 'Te esperamos en Don Coche.',
        confirmButtonColor: '#005f73',
      }).then(() => {
        reset();
      });
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: res.message,
        confirmButtonColor: '#005f73',
      });
    }
  };

  // Hoy para el mínimo de fecha
  const today = new Date().toISOString().split('T')[0];

  // Observamos la fecha para cargar los slots ocupados
  const selectedDate = watch('scheduledAtDate');
  
  React.useEffect(() => {
    if (selectedDate) {
      setLoadingSlots(true);
      getPublicBookedSlots(selectedDate).then(slots => {
        setBookedSlots(slots);
        setLoadingSlots(false);
        // Si la hora actual seleccionada está en los slots ocupados, limpiarla
        const currentSlot = watch('scheduledAtTime');
        if (currentSlot && slots.includes(parseInt(currentSlot.split(':')[0]))) {
          setValue('scheduledAtTime', '', { shouldValidate: true });
        }
      });
    } else {
      setBookedSlots([]);
    }
  }, [selectedDate, setValue, watch]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 fade-in">
      {/* Sección 1: Datos Personales */}
      <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant">
        <h2 className="text-2xl font-headline-bold text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">person</span>
          Tus Datos Personales
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="customerCc">Cédula de Ciudadanía *</label>
            <input 
              {...register('customerCc')}
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface placeholder-on-surface-variant focus:ring-primary focus:border-primary ${errors.customerCc ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="customerCc" 
              placeholder="Ej: 1700000000" 
            />
            <ErrorMessage message={errors.customerCc?.message} />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="customerName">Nombre Completo *</label>
            <input 
              {...register('customerName')}
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface placeholder-on-surface-variant focus:ring-primary focus:border-primary ${errors.customerName ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="customerName" 
              placeholder="Ej: Juan Pérez" 
            />
            <ErrorMessage message={errors.customerName?.message} />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="customerPhone">Celular *</label>
            <input 
              {...register('customerPhone')}
              type="tel"
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface placeholder-on-surface-variant focus:ring-primary focus:border-primary ${errors.customerPhone ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="customerPhone" 
              placeholder="Ej: 300 000 0000" 
            />
            <ErrorMessage message={errors.customerPhone?.message} />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="customerEmail">Correo Electrónico</label>
            <input 
              {...register('customerEmail')}
              type="email"
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface placeholder-on-surface-variant focus:ring-primary focus:border-primary ${errors.customerEmail ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="customerEmail" 
              placeholder="correo@ejemplo.com (Opcional)" 
            />
            <ErrorMessage message={errors.customerEmail?.message} />
          </div>
        </div>
      </div>

      {/* Sección 2: Vehículo */}
      <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant">
        <h2 className="text-2xl font-headline-bold text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">directions_car</span>
          Datos de tu Vehículo
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="plate">Placa *</label>
            <input 
              {...register('plate')}
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface placeholder-on-surface-variant focus:ring-primary focus:border-primary uppercase font-bold text-lg ${errors.plate ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="plate" 
              placeholder="ABC-1234" 
            />
            <ErrorMessage message={errors.plate?.message} />
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="carBrand">Marca *</label>
            <input 
              {...register('carBrand')}
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface placeholder-on-surface-variant focus:ring-primary focus:border-primary ${errors.carBrand ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="carBrand" 
              placeholder="Ej: Mazda" 
            />
            <ErrorMessage message={errors.carBrand?.message} />
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="carModel">Modelo *</label>
            <input 
              {...register('carModel')}
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface placeholder-on-surface-variant focus:ring-primary focus:border-primary ${errors.carModel ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="carModel" 
              placeholder="Ej: 3 Touring" 
            />
            <ErrorMessage message={errors.carModel?.message} />
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="carColor">Color</label>
            <input 
              {...register('carColor')}
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface placeholder-on-surface-variant focus:ring-primary focus:border-primary ${errors.carColor ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="carColor" 
              placeholder="Ej: Rojo (Opcional)" 
            />
            <ErrorMessage message={errors.carColor?.message} />
          </div>
        </div>
      </div>

      {/* Sección 3: Agendamiento */}
      <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant">
        <h2 className="text-2xl font-headline-bold text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">event_available</span>
          Detalles de la Cita
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="scheduledAtDate">Fecha de la Cita *</label>
            <Controller
              control={control}
              name="scheduledAtDate"
              render={({ field }) => (
                <DatePicker
                  placeholderText="Selecciona una fecha"
                  selected={field.value ? new Date(`${field.value}T00:00:00`) : null}
                  onChange={(date: Date | null) => {
                    if (date) {
                      // Formatear a YYYY-MM-DD
                      const d = new Date(date);
                      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      field.onChange(isoDate);
                    } else {
                      field.onChange('');
                    }
                  }}
                  minDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface focus:ring-primary focus:border-primary ${errors.scheduledAtDate ? 'border-error focus:ring-error' : 'border-outline'}`}
                />
              )}
            />
            <ErrorMessage message={errors.scheduledAtDate?.message} />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Hora *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: '08:00', label: '08:00 AM' },
                { value: '09:00', label: '09:00 AM' },
                { value: '10:00', label: '10:00 AM' },
                { value: '11:00', label: '11:00 AM' },
                { value: '12:00', label: '12:00 PM' },
                { value: '14:00', label: '02:00 PM' },
                { value: '15:00', label: '03:00 PM' },
                { value: '16:00', label: '04:00 PM' },
                { value: '17:00', label: '05:00 PM' },
              ].map((time) => {
                const hour = parseInt(time.value.split(':')[0]);
                const isBooked = bookedSlots.includes(hour);
                
                return (
                  <button
                    key={time.value}
                    type="button"
                    disabled={isBooked || loadingSlots}
                    onClick={() => setValue('scheduledAtTime', time.value, { shouldValidate: true })}
                    className={`py-2 px-1 text-center text-sm font-bold rounded-lg border transition-all ${
                      isBooked
                        ? 'bg-surface-variant text-on-surface-variant border-surface-variant opacity-50 cursor-not-allowed'
                        : watch('scheduledAtTime') === time.value
                        ? 'bg-primary text-on-primary border-primary shadow-md transform scale-[1.02]'
                        : 'bg-surface-container text-on-surface border-outline-variant hover:border-primary hover:bg-surface-container-high'
                    }`}
                  >
                    {time.label} {isBooked && ' (Reservado)'}
                  </button>
                );
              })}
            </div>
            {/* Campo oculto para registrar en react-hook-form */}
            <input type="hidden" {...register('scheduledAtTime')} />
            <ErrorMessage message={errors.scheduledAtTime?.message} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-on-surface mb-2">Motivo / Servicio *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { value: 'Lavado Sencillo', icon: 'local_car_wash' },
                { value: 'Lavado General', icon: 'water_drop' },
                { value: 'Cambio de Aceite', icon: 'oil_barrel' },
                { value: 'Mantenimiento Preventivo', icon: 'build' },
                { value: 'Revisión de Frenos', icon: 'tire_repair' },
                { value: 'Otro', icon: 'more_horiz' },
              ].map((motivo) => (
                <button
                  key={motivo.value}
                  type="button"
                  onClick={() => setValue('description', motivo.value, { shouldValidate: true })}
                  className={`py-3 px-2 flex flex-col items-center justify-center gap-1 text-center text-sm font-bold rounded-xl border transition-all ${
                    watch('description') === motivo.value
                      ? 'bg-primary text-on-primary border-primary shadow-md transform scale-[1.02]'
                      : 'bg-surface-container text-on-surface border-outline-variant hover:border-primary hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">{motivo.icon}</span>
                  <span className="leading-tight">{motivo.value === 'Otro' ? 'Otro servicio' : motivo.value}</span>
                </button>
              ))}
            </div>
            <input type="hidden" {...register('description')} />
            <ErrorMessage message={errors.description?.message} />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <PrimaryButton
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[56px] rounded-full font-cta text-[18px] shadow-sm transition-all transform hover:scale-[1.01]"
        >
          {isSubmitting ? (
            <span className="material-symbols-outlined animate-spin">refresh</span>
          ) : (
            <span className="material-symbols-outlined">event</span>
          )}
          Confirmar Agendamiento
        </PrimaryButton>
      </div>
    </form>
  );
};
