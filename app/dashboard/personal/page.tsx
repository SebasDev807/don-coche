import { Metadata } from 'next';
import { getStaffUsers } from './actions';
import { StaffKPIs } from './components/StaffKPIs';
import { StaffToolbar } from './components/StaffToolbar';
import { StaffTable } from './components/StaffTable';

export const metadata: Metadata = {
  title: 'Directorio de Personal | AutoPro',
  description: 'Gestión de operarios, administradores y accesos al sistema',
};

export default async function PersonalPage() {
  const users = await getStaffUsers();

  return (
    <>
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
    </>
  );
}
