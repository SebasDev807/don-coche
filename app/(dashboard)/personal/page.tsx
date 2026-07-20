import { Metadata } from 'next';
import { Suspense } from 'react';
import { getStaffUsers } from '@/actions/personal';
import { StaffKPIs, StaffToolbar, StaffTable } from '@/components/dashboard/personal';

export const metadata: Metadata = {
  title: 'Gestión de Personal | Don Coche',
  description: 'Gestión de operarios, administradores y accesos al sistema',
};

/**
 * Página principal del directorio de personal (Server Component).
 * 
 * Obtiene la lista de usuarios del sistema desde la base de datos de manera
 * asíncrona y renderiza las vistas correspondientes: indicadores clave (KPIs),
 * la barra de herramientas y la tabla interactiva de empleados.
 * 
 * @returns {Promise<JSX.Element>} La estructura completa de la página de Personal.
 */
export default async function PersonalPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const role = typeof searchParams.role === 'string' ? searchParams.role : undefined;
  const users = await getStaffUsers(query, role);

  return (
    <div className='fade-in'>
      <main className="flex-grow max-w-[1440px] mx-auto w-full">
        <header className="mb-stack-lg">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Directorio de Personal</h1>
          <p className="font-body-lg text-body-lg text-secondary">Gestión de operarios, administradores y accesos al sistema</p>
        </header>

        {/* KPI Cards */}
        <StaffKPIs users={users} />

        {/* Action Bar */}
        <Suspense fallback={<div className="h-touch-target-min w-full bg-surface-container-lowest border border-outline-variant rounded-lg animate-pulse mb-stack-md" />}>
          <StaffToolbar />
        </Suspense>

        {/* Employee Table */}
        <StaffTable users={users} />
      </main>
    </div>
  );
}
