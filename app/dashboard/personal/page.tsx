import { Metadata } from 'next';
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
export default async function PersonalPage() {
  const users = await getStaffUsers();

  return (
    <div className='fade-in'>
      <header className="mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Directorio de Personal</h1>
        <p className="font-body-lg text-body-lg text-secondary">Gestión de operarios, administradores y accesos al sistema</p>
      </header>

      {/* KPI Cards */}
      <StaffKPIs users={users} />

      {/* Action Bar */}
      <StaffToolbar />

      {/* Employee Table */}
      <StaffTable users={users} />
    </div>
  );
}
