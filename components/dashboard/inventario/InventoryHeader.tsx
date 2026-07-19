'use client';

import React from 'react';
import Link from 'next/link';
import { ExportExcelButton } from '@/components/ui';

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
      <div className="flex items-center gap-4 w-full md:w-auto flex-wrap lg:flex-nowrap">
        <div className="relative flex-1 lg:flex-none w-full lg:w-auto min-w-[200px]">
          <select 
            className="appearance-none cursor-pointer h-touch-target-min pl-10 pr-10 bg-surface-container-lowest border border-outline-variant text-on-surface font-cta text-cta rounded-lg hover:bg-surface-container transition-colors w-full outline-none focus:ring-1 focus:ring-primary-container"
            defaultValue=""
          >
            <option value="">Filtrar por Categoría</option>
            <option value="LUBRICANTES">Lubricantes</option>
            <option value="ACCESORIOS">Accesorios</option>
            <option value="SERVITECA">Serviteca</option>
            <option value="LAVADERO">Lavadero</option>
          </select>
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">filter_list</span>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
        </div>
        
        <ExportExcelButton 
          onClick={() => {
            console.log('Exportar inventario a Excel iniciado...');
          }}
        />
        
        <Link href="/dashboard/inventario/new" className="cursor-pointer h-touch-target-min px-6 bg-primary-container text-[#000000] font-cta text-cta rounded-lg hover:bg-primary-fixed-dim transition-colors flex items-center gap-2 shadow-sm flex-1 lg:flex-none justify-center active:scale-[0.98] whitespace-nowrap">
          <span className="material-symbols-outlined">add</span>
          Agregar Producto
        </Link>
      </div>
    </div>
  );
}
