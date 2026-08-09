import { RescheduleForm } from '@/components/public/RescheduleForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Modificar Cita | Don Coche',
  description: 'Reprograma tu cita existente en Don Coche.',
};

export default function ModificarCitaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="text-center mb-12 fade-in">
        <h1 className="text-4xl md:text-5xl font-headline-black text-on-surface mb-4">
          Reprograma tu Cita
        </h1>
        <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          Ingresa tu número de cédula para ver tus citas pendientes y seleccionar una nueva fecha u hora disponible.
        </p>
      </div>

      <RescheduleForm />
    </div>
  );
}
