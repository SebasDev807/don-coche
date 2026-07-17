'use client';

/**
 * Componente que renderiza la barra de herramientas (Toolbar) de la sección personal.
 * 
 * Contiene el campo de búsqueda de empleados y los botones de acción para
 * filtrar el listado y para agregar a un nuevo empleado.
 * 
 * @returns {JSX.Element} Barra de herramientas interactiva para la gestión de personal.
 */
export function StaffToolbar() {
  return (
    <section className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-stack-md">
      <div className="w-full lg:w-1/2 relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
        <input 
          className="w-full h-touch-target-min pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md text-on-surface outline-none transition-colors" 
          placeholder="Buscar empleado por nombre, CC, email, teléfono..." 
          type="text" 
        />
      </div>
      <div className="flex items-center gap-4 w-full lg:w-auto">
        <button className="cursor-pointer h-touch-target-min px-6 bg-surface-container-lowest border border-outline-variant text-on-surface font-cta text-cta rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2 flex-1 lg:flex-none justify-center">
          <span className="material-symbols-outlined">filter_list</span>
          Filtrar por Rol
        </button>
        <button className="cursor-pointer h-touch-target-min px-6 bg-primary-container text-[#000000] font-cta text-cta rounded-lg hover:bg-primary-fixed-dim transition-colors flex items-center gap-2 shadow-sm flex-1 lg:flex-none justify-center active:scale-[0.98]">
          <span className="material-symbols-outlined">add</span>
          Agregar Empleado
        </button>
      </div>
    </section>
  );
}
