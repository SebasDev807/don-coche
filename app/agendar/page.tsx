import { BookingForm } from '@/components/public/BookingForm';

export default function AgendarPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="text-center mb-12 fade-in">
        <h1 className="text-4xl md:text-5xl font-headline-black text-on-surface mb-4">
          Agenda tu Cita
        </h1>
        <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          Llena el formulario a continuación y asegura tu espacio. Mantén tu vehículo en óptimas condiciones con nuestros expertos.
        </p>
      </div>

      <BookingForm />
    </div>
  );
}
