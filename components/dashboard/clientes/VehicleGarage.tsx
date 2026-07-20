'use client';

import React from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { deleteVehicle } from '@/actions/vehicles';

const MySwal = withReactContent(Swal);

interface VehicleGarageProps {
  vehicles: any[];
  customerId: string;
}

export function VehicleGarage({ vehicles, customerId }: VehicleGarageProps) {
  const handleDelete = async (vehicleId: string) => {
    const result = await MySwal.fire({
      title: '¿Eliminar vehículo?',
      text: "Esto removerá el vehículo del cliente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgba(221, 213, 51, 1)',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: '!text-black'
      }
    });

    if (result.isConfirmed) {
      const res = await deleteVehicle(vehicleId);
      if (res.success) {
        MySwal.fire('Eliminado', res.message, 'success');
      } else {
        MySwal.fire('Error', res.message, 'error');
      }
    }
  };

  if (vehicles.length === 0) {
    return (
      <div className="border-2 border-dashed border-outline-variant/60 rounded-xl p-12 flex flex-col items-center justify-center text-secondary bg-surface-container-lowest/50">
        <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">directions_car</span>
        <p className="text-body-lg text-center">Este cliente aún no tiene vehículos registrados.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vehicles.map((vehicle) => (
        <div key={vehicle.id} className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
          {/* Delete Button (visible on hover or always on touch) */}
          <button
            onClick={() => handleDelete(vehicle.id)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-container hover:bg-error hover:text-white text-secondary flex items-center justify-center transition-colors shadow-sm opacity-100 sm:opacity-0 group-hover:opacity-100"
            title="Eliminar vehículo"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>

          {/* License Plate Design */}
          <div className="flex justify-center mb-4">
            <div className="border-4 border-yellow-400 bg-yellow-300 px-6 py-2 rounded-lg shadow-inner relative flex items-center justify-center min-w-[140px]">
              {/* Fake screw holes */}
              <div className="absolute top-1 left-2 w-1.5 h-1.5 rounded-full bg-yellow-600"></div>
              <div className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-yellow-600"></div>
              <div className="absolute bottom-1 left-2 w-1.5 h-1.5 rounded-full bg-yellow-600"></div>
              <div className="absolute bottom-1 right-2 w-1.5 h-1.5 rounded-full bg-yellow-600"></div>
              
              <span className="font-display-lg text-black text-2xl tracking-widest uppercase font-bold drop-shadow-sm">
                {vehicle.plate}
              </span>
            </div>
          </div>

          <div className="text-center space-y-1 mt-2">
            <p className="font-label-lg text-on-surface truncate">{vehicle.brand || 'Marca Desconocida'} {vehicle.model || ''}</p>
            {vehicle.color && (
              <p className="font-body-sm text-secondary flex items-center justify-center gap-1">
                <span className="w-3 h-3 rounded-full border border-outline-variant shadow-sm" style={{ backgroundColor: vehicle.color.toLowerCase() }}></span>
                Color {vehicle.color}
              </p>
            )}
            {!vehicle.color && (
              <p className="font-body-sm text-secondary">Sin color registrado</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
