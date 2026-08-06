import { Metadata } from 'next';
import { Suspense } from 'react';
import { getAppointments, getAppointmentKPIs } from '@/actions/appointments';
import {
  AppointmentKPIs,
  AppointmentFilters,
  AppointmentsTable,
} from '@/components/dashboard/citas';
import { ExportExcelButton } from '@/components/ui/ExportExcelButton';
import { PrimaryButton } from '@/components/ui';
import type { AppointmentStatus } from '@prisma/client';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Próximas Citas | Don Coche',
  description: 'Visualice y gestione las citas agendadas de los clientes.',
};

/**
 * Página principal de la vista de citas (Server Component).
 *
 * Lee los searchParams de la URL para aplicar filtros server-side:
 * - `status` → Estado de la cita (PENDIENTE por defecto)
 * - `q` → Búsqueda por nombre de cliente o placa de vehículo
 *
 * @returns {Promise<JSX.Element>} La estructura completa de la página de Citas.
 */
export default async function CitasPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const statusParam = typeof searchParams.status === 'string' ? searchParams.status : 'PENDIENTE';
  const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;

  // Validar que el status es un valor válido del enum
  const validStatuses: AppointmentStatus[] = ['PENDIENTE', 'CUMPLIDA', 'PERDIDA', 'CANCELADA'];
  const status = validStatuses.includes(statusParam as AppointmentStatus)
    ? (statusParam as AppointmentStatus)
    : undefined;

  const [appointmentsResult, kpisResult] = await Promise.all([
    getAppointments({ status, query }),
    getAppointmentKPIs(),
  ]);

  const appointments = appointmentsResult.data ?? [];
  const kpis = kpisResult.data;

  // Construir el endpoint de exportación con los filtros actuales
  const exportParams = new URLSearchParams();
  if (status) exportParams.set('status', status);
  if (query) exportParams.set('q', query);
  const exportEndpoint = `/api/v1/export/citas${exportParams.toString() ? `?${exportParams.toString()}` : ''}`;

  return (
    <div className="fade-in">
      <main className="flex-grow max-w-[1440px] mx-auto w-full">
        {/* Header */}
        <header className="mb-stack-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
              Próximas Citas
            </h1>
            <p className="font-body-lg text-body-lg text-secondary">
              Visualice las citas agendadas y su estado actual.
            </p>
          </div>
          <PrimaryButton href="/citas/agendar">
            <span className="material-symbols-outlined">calendar_add_on</span>
            Agendar Cita
          </PrimaryButton>
        </header>

        {/* KPIs */}
        <AppointmentKPIs kpis={kpis} />

        {/* Filters + Export Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 mb-stack-md">
          <Suspense
            fallback={
              <div className="h-touch-target-min w-full bg-surface-container-lowest border border-outline-variant rounded-lg animate-pulse" />
            }
          >
            <AppointmentFilters />
          </Suspense>

          <ExportExcelButton
            endpoint={exportEndpoint}
            filename={`Citas_Don_Coche_${new Date().toISOString().split('T')[0]}.xlsx`}
            disabled={appointments.length === 0}
          />
        </div>

        {/* Table */}
        <AppointmentsTable appointments={appointments} />
      </main>
    </div>
  );
}
