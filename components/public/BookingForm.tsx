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

const MySwal = withReactContent(Swal);

import { PrimaryButton } from '@/components/ui/PrimaryButton';

export const BookingForm = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
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
            {errors.customerCc && <p className="text-error text-xs mt-1 font-bold">{errors.customerCc.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="customerName">Nombre Completo *</label>
            <input 
              {...register('customerName')}
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface placeholder-on-surface-variant focus:ring-primary focus:border-primary ${errors.customerName ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="customerName" 
              placeholder="Ej: Juan Pérez" 
            />
            {errors.customerName && <p className="text-error text-xs mt-1 font-bold">{errors.customerName.message}</p>}
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
            {errors.customerPhone && <p className="text-error text-xs mt-1 font-bold">{errors.customerPhone.message}</p>}
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
            {errors.customerEmail && <p className="text-error text-xs mt-1 font-bold">{errors.customerEmail.message}</p>}
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
            {errors.plate && <p className="text-error text-xs mt-1 font-bold">{errors.plate.message}</p>}
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="carBrand">Marca *</label>
            <input 
              {...register('carBrand')}
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface placeholder-on-surface-variant focus:ring-primary focus:border-primary ${errors.carBrand ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="carBrand" 
              placeholder="Ej: Mazda" 
            />
            {errors.carBrand && <p className="text-error text-xs mt-1 font-bold">{errors.carBrand.message}</p>}
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="carModel">Modelo *</label>
            <input 
              {...register('carModel')}
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface placeholder-on-surface-variant focus:ring-primary focus:border-primary ${errors.carModel ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="carModel" 
              placeholder="Ej: 3 Touring" 
            />
            {errors.carModel && <p className="text-error text-xs mt-1 font-bold">{errors.carModel.message}</p>}
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="carColor">Color</label>
            <input 
              {...register('carColor')}
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface placeholder-on-surface-variant focus:ring-primary focus:border-primary ${errors.carColor ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="carColor" 
              placeholder="Ej: Rojo (Opcional)" 
            />
            {errors.carColor && <p className="text-error text-xs mt-1 font-bold">{errors.carColor.message}</p>}
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
                  onChange={(date) => {
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
            {errors.scheduledAtDate && <p className="text-error text-xs mt-1 font-bold">{errors.scheduledAtDate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="scheduledAtTime">Hora *</label>
            <select
              {...register('scheduledAtTime')}
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface focus:ring-primary focus:border-primary ${errors.scheduledAtTime ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="scheduledAtTime"
            >
              <option value="">Seleccione una hora</option>
              <option value="08:00">08:00 AM</option>
              <option value="09:00">09:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="14:00">02:00 PM</option>
              <option value="15:00">03:00 PM</option>
              <option value="16:00">04:00 PM</option>
              <option value="17:00">05:00 PM</option>
            </select>
            {errors.scheduledAtTime && <p className="text-error text-xs mt-1 font-bold">{errors.scheduledAtTime.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="description">Motivo / Servicio *</label>
            <select
              {...register('description')}
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface focus:ring-primary focus:border-primary ${errors.description ? 'border-error focus:ring-error' : 'border-outline'}`}
              id="description"
            >
              <option value="">Seleccione un motivo principal</option>
              <option value="Lavado Sencillo">Lavado Sencillo</option>
              <option value="Lavado General">Lavado General</option>
              <option value="Cambio de Aceite">Cambio de Aceite</option>
              <option value="Mantenimiento Preventivo">Mantenimiento Preventivo</option>
              <option value="Revisión de Frenos">Revisión de Frenos</option>
              <option value="Otro">Otro servicio</option>
            </select>
            {errors.description && <p className="text-error text-xs mt-1 font-bold">{errors.description.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <PrimaryButton
          type="submit"
          isLoading={isSubmitting}
          icon="event"
          className="h-[56px] px-8 rounded-full font-cta text-[18px] shadow-sm transition-all transform hover:scale-[1.02]"
        >
          Confirmar Agendamiento
        </PrimaryButton>
      </div>
    </form>
  );
};
