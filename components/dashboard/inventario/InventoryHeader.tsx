import React from 'react';

/**
 * Componente que muestra el encabezado de la pantalla de Inventario.
 * Contiene el título principal y las acciones principales de la vista.
 * 
 * @returns {React.JSX.Element} El componente InventoryHeader.
 */
export function InventoryHeader() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-stack-md gap-4">
      <div>
        <h1 className="font-headline-md text-headline-md text-on-background mb-1">
          Inventario Maestro
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Control detallado de existencias y valoración de activos.
        </p>
      </div>
      <div className="flex flex-row flex-nowrap gap-3">
        <button className="h-touch-target-min px-6 rounded-lg bg-surface-container-highest text-on-surface font-cta text-cta flex items-center gap-2 hover:bg-surface-container-highest/80 transition-colors whitespace-nowrap cursor-pointer">
          <span className="material-symbols-outlined">filter_list</span>
          Filtrar por Categoría
        </button>
        <button className="h-touch-target-min px-6 rounded-lg bg-inverse-surface text-inverse-on-surface font-cta text-cta flex items-center gap-2 hover:bg-inverse-surface/90 transition-colors whitespace-nowrap cursor-pointer">
          <span className="material-symbols-outlined">download</span>
          Exportar a Excel
        </button>
        <button className="h-touch-target-min px-6 rounded-lg bg-primary-container text-on-primary-container font-cta text-cta flex items-center gap-2 hover:bg-primary-container/90 transition-colors whitespace-nowrap cursor-pointer">
          <span className="material-symbols-outlined">add</span>
          Agregar Producto
        </button>
      </div>
    </div>
  );
}
