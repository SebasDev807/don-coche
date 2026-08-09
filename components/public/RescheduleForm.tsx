'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { getPendingAppointmentsByCc, rescheduleAppointmentAction, type PendingAppointmentInfo } from '@/actions/public/reschedule.actions';
import { getPublicBookedSlots } from '@/actions/public/appointment.actions';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const MySwal = withReactContent(Swal);

export const RescheduleForm = () => {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cc, setCc] = useState('');
  const [ccError, setCcError] = useState('');
  
  const [appointments, setAppointments] = useState<PendingAppointmentInfo[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<PendingAppointmentInfo | null>(null);
  
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  
  const [bookedSlots, setBookedSlots] = useState<number[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paso 1: Buscar citas
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cc || cc.trim() === '') {
      setCcError('Ingresa una cédula válida');
      return;
    }
    setCcError('');
    setIsSubmitting(true);
    
    const results = await getPendingAppointmentsByCc(cc.trim());
    setIsSubmitting(false);

    if (results.length === 0) {
      MySwal.fire({
        icon: 'info',
        title: 'Sin citas',
        text: 'No encontramos citas pendientes asociadas a este documento.',
        confirmButtonColor: '#005f73',
      });
    } else {
      setAppointments(results);
      setStep(2);
    }
  };

  // Paso 2: Seleccionar Cita
  const handleSelectAppointment = (apt: PendingAppointmentInfo) => {
    setSelectedAppointment(apt);
    setStep(3);
  };

  // Observador de fecha en Paso 3
  React.useEffect(() => {
    if (newDate) {
      setLoadingSlots(true);
      getPublicBookedSlots(newDate).then(slots => {
        setBookedSlots(slots);
        setLoadingSlots(false);
        // Si la hora actual seleccionada está en los slots ocupados, limpiarla
        if (newTime && slots.includes(parseInt(newTime.split(':')[0]))) {
          setNewTime('');
        }
      });
    } else {
      setBookedSlots([]);
    }
  }, [newDate]);

  // Paso 3: Guardar
  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    
    if (!newDate) {
      setDateError('Selecciona una fecha');
      hasError = true;
    } else {
      setDateError('');
    }

    if (!newTime) {
      setTimeError('Selecciona una hora');
      hasError = true;
    } else {
      setTimeError('');
    }

    if (hasError || !selectedAppointment) return;

    setIsSubmitting(true);
    MySwal.showLoading();

    const scheduledAt = new Date(`${newDate}T${newTime}:00`);
    // Add timezone offset so it matches local time. (Assume UTC-5 for Colombia)
    scheduledAt.setHours(scheduledAt.getHours() + 5);

    const res = await rescheduleAppointmentAction(selectedAppointment.id, scheduledAt);

    setIsSubmitting(false);
    MySwal.close();

    if (res.success) {
      MySwal.fire({
        icon: 'success',
        title: '¡Cita Reprogramada!',
        text: 'Tu nueva fecha ha sido guardada con éxito.',
        confirmButtonColor: '#005f73',
      }).then(() => {
        router.push('/');
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

  return (
    <div className="space-y-8 fade-in">
      {/* ProgressBar */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-4 text-sm font-bold">
          <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>1. Buscar</span>
          <span className="material-symbols-outlined text-surface-variant">arrow_forward</span>
          <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>2. Seleccionar</span>
          <span className="material-symbols-outlined text-surface-variant">arrow_forward</span>
          <span className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>3. Modificar</span>
        </div>
      </div>

      {/* Paso 1 */}
      {step === 1 && (
        <form onSubmit={handleSearch} className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant max-w-md mx-auto">
          <h2 className="text-2xl font-headline-bold text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined">search</span>
            Buscar tus citas
          </h2>
          <div className="mb-6">
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="cc">Cédula de Ciudadanía *</label>
            <input 
              className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface focus:ring-primary focus:border-primary ${ccError ? 'border-error' : 'border-outline'}`}
              id="cc" 
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="Ej: 1700000000" 
            />
            <ErrorMessage message={ccError} />
          </div>
          <PrimaryButton type="submit" disabled={isSubmitting} className="w-full h-12 rounded-full font-cta">
            {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Buscar Citas'}
          </PrimaryButton>
        </form>
      )}

      {/* Paso 2 */}
      {step === 2 && (
        <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-headline-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">list_alt</span>
              Citas Pendientes
            </h2>
            <button onClick={() => setStep(1)} className="text-sm font-bold text-primary hover:underline">Cambiar Cédula</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map(apt => {
              const aptDate = new Date(apt.scheduledAt);
              return (
                <div key={apt.id} onClick={() => handleSelectAppointment(apt)} className="p-4 rounded-xl border border-outline-variant bg-surface-container hover:border-primary cursor-pointer transition-all hover:shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-3xl text-primary">directions_car</span>
                    <div>
                      <p className="font-bold text-lg">{apt.vehicle.plate}</p>
                      <p className="text-sm text-on-surface-variant">{apt.vehicle.brand} {apt.vehicle.model}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-surface-variant">
                    <p className="text-sm"><strong>Servicio:</strong> {apt.description || 'General'}</p>
                    <p className="text-sm"><strong>Fecha actual:</strong> {aptDate.toLocaleDateString('es-CO')} {aptDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paso 3 */}
      {step === 3 && selectedAppointment && (
        <form onSubmit={handleReschedule} className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-headline-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">edit_calendar</span>
              Nueva Fecha y Hora
            </h2>
            <button type="button" onClick={() => setStep(2)} className="text-sm font-bold text-primary hover:underline">Volver a lista</button>
          </div>

          <div className="mb-6 p-4 bg-surface-container rounded-lg border border-outline-variant">
            <p className="text-sm text-on-surface-variant mb-1">Cita seleccionada:</p>
            <p className="font-bold">{selectedAppointment.vehicle.plate} - {selectedAppointment.description || 'General'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Nueva Fecha *</label>
              <DatePicker
                placeholderText="Selecciona una fecha"
                selected={newDate ? new Date(`${newDate}T00:00:00`) : null}
                onChange={(date: Date | null) => {
                  if (date) {
                    const d = new Date(date);
                    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    setNewDate(isoDate);
                    setDateError('');
                  } else {
                    setNewDate('');
                  }
                }}
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                className={`block w-full bg-surface-container rounded-lg border shadow-sm py-3 px-4 text-on-surface focus:ring-primary focus:border-primary ${dateError ? 'border-error' : 'border-outline'}`}
              />
              <ErrorMessage message={dateError} />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Nueva Hora *</label>
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
                      disabled={isBooked || loadingSlots || !newDate}
                      onClick={() => { setNewTime(time.value); setTimeError(''); }}
                      className={`py-2 px-1 text-center text-sm font-bold rounded-lg border transition-all ${
                        !newDate 
                          ? 'bg-surface-variant opacity-30 cursor-not-allowed'
                          : isBooked
                          ? 'bg-surface-variant text-on-surface-variant border-surface-variant opacity-50 cursor-not-allowed'
                          : newTime === time.value
                          ? 'bg-primary text-on-primary border-primary shadow-md transform scale-[1.02]'
                          : 'bg-surface-container text-on-surface border-outline-variant hover:border-primary hover:bg-surface-container-high'
                      }`}
                    >
                      {time.label} {isBooked && ' (Reservado)'}
                    </button>
                  );
                })}
              </div>
              <ErrorMessage message={timeError} />
            </div>
          </div>

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
            Guardar Cambios
          </PrimaryButton>
        </form>
      )}
    </div>
  );
};
