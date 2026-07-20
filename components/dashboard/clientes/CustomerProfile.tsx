'use client';

import React, { useState } from 'react';
import { VehicleGarage } from './VehicleGarage';
import { PrimaryButton } from '@/components/ui';

interface CustomerProfileProps {
  customer: any; // Ideally a strict type
  onEditCustomer?: () => void;
  onAddVehicle?: () => void;
}

export function CustomerProfile({ customer, onEditCustomer, onAddVehicle }: CustomerProfileProps) {
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-secondary bg-surface-container-lowest p-8 rounded-tr-xl rounded-br-xl">
        <span className="material-symbols-outlined text-[64px] mb-4 opacity-50">group</span>
        <h2 className="text-headline-sm text-on-surface">Ningún cliente seleccionado</h2>
        <p className="text-center mt-2 max-w-md">Selecciona un cliente de la lista de la izquierda o crea uno nuevo para ver su perfil y garaje de vehículos.</p>
      </div>
    );
  }

  const initial = customer.name ? customer.name.charAt(0) : '?';

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest overflow-y-auto">
      {/* Header / Basic Info */}
      <div className="p-8 pb-6 border-b border-outline-variant/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-display-sm text-[32px] uppercase shadow-sm">
            {initial}
          </div>
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">{customer.name || 'Sin Nombre'}</h2>
            <div className="flex flex-wrap items-center gap-4 text-secondary font-body-md">
              {customer.phone && (
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">phone</span>
                  {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  {customer.email}
                </div>
              )}
              <div className="flex items-center gap-1 text-on-surface-variant bg-surface-variant/50 px-2 py-0.5 rounded-full text-[12px] font-label-md">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                Registrado {new Date(customer.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onEditCustomer}
            className="h-10 px-4 rounded-full border border-outline-variant text-secondary hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center justify-center gap-2 font-label-lg"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Editar
          </button>
        </div>
      </div>

      {/* Garage Section */}
      <div className="p-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">garage</span>
            Garaje Virtual ({customer.vehicles?.length || 0})
          </h3>
          <PrimaryButton onClick={onAddVehicle} className="h-10 px-4 text-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Añadir Vehículo
          </PrimaryButton>
        </div>

        <VehicleGarage vehicles={customer.vehicles || []} customerId={customer.id} />
      </div>
    </div>
  );
}
