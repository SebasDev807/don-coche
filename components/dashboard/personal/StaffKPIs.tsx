import { User } from '@prisma/client';

/**
 * Propiedades del componente StaffKPIs.
 */
interface StaffKPIsProps {
  /** Lista de usuarios del personal (staff) traída desde la BD */
  users: User[];
}

/**
 * Componente que muestra las métricas principales (KPIs) del personal.
 * 
 * Calcula y renderiza el total de empleados registrados en el sistema,
 * así como los que se encuentran actualmente activos.
 * 
 * @param {StaffKPIsProps} props - Propiedades del componente, que incluyen el listado de usuarios.
 * @returns {JSX.Element} El componente de React para visualizar las tarjetas de métricas.
 */
export function StaffKPIs({ users }: StaffKPIsProps) {
  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-stack-lg">
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-highest flex items-center gap-4">
        <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container">
          <span className="material-symbols-outlined text-2xl">group</span>
        </div>
        <div>
          <p className="font-label-bold text-label-bold text-secondary mb-1">Total Empleados</p>
          <p className="font-display-lg text-display-lg text-on-surface">{users.length}</p>
        </div>
      </div>
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-highest flex items-center gap-4">
        <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container">
          <span className="material-symbols-outlined text-2xl">schedule</span>
        </div>
        <div>
          <p className="font-label-bold text-label-bold text-secondary mb-1">Turno Actual</p>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">{activeCount} Activos en Sistema</p>
        </div>
      </div>
    </section>
  );
}
