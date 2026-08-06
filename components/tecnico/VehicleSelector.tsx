'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { VehicleInfo } from './CustomerSearchBar';

interface VehicleSelectorProps {
  vehicles: VehicleInfo[];
  onSelectVehicle: (vehicle: VehicleInfo) => void;
  onClear?: () => void;
}

export function VehicleSelector({ vehicles, onSelectVehicle, onClear }: VehicleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset when vehicles change (new customer selected)
  useEffect(() => {
    setSelectedLabel('');
    setIsOpen(false);
  }, [vehicles]);

  const handleSelect = useCallback((vehicle: VehicleInfo) => {
    onSelectVehicle(vehicle);
    const label = [vehicle.plate, vehicle.brand, vehicle.model, vehicle.color]
      .filter(Boolean)
      .join(' — ');
    setSelectedLabel(label);
    setIsOpen(false);
  }, [onSelectVehicle]);

  const handleClear = useCallback(() => {
    setSelectedLabel('');
    setIsOpen(false);
    if (onClear) onClear();
  }, [onClear]);

  if (vehicles.length === 0) {
    return (
      <div className="w-full">
        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          <span className="material-symbols-outlined text-sm align-middle mr-1">directions_car</span>
          Vehículos del Cliente
        </label>
        <div className="flex items-center gap-2 bg-surface-container border border-outline-variant rounded-lg py-3 px-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-lg">info</span>
          <span className="text-sm">Sin vehículos registrados — ingrese los datos manualmente abajo.</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
        <span className="material-symbols-outlined text-sm align-middle mr-1">directions_car</span>
        Vehículos del Cliente
      </label>

      {selectedLabel ? (
        <div className="flex items-center gap-2 bg-primary-container/20 border border-primary-container rounded-lg py-3 px-4">
          <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
          <span className="text-sm font-medium text-on-surface flex-1 truncate">{selectedLabel}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-on-surface-variant hover:text-error transition-colors cursor-pointer"
            aria-label="Limpiar vehículo"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm hover:border-primary transition-colors cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-xl">
              garage_home
            </span>
            <span className="flex-1 text-sm text-on-surface-variant">
              Seleccione un vehículo ({vehicles.length} disponible{vehicles.length > 1 ? 's' : ''})
            </span>
            <span className={`material-symbols-outlined text-on-surface-variant text-lg transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {isOpen && (
            <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg overflow-hidden animate-[fadeIn_0.15s_ease-out]">
              {vehicles.map((vehicle) => (
                <li key={vehicle.id}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors text-left cursor-pointer"
                    onClick={() => handleSelect(vehicle)}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-xl shrink-0">
                      directions_car
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface uppercase tracking-wide">
                          {vehicle.plate}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {vehicle.brand && (
                          <span className="text-xs text-on-surface-variant">{vehicle.brand}</span>
                        )}
                        {vehicle.brand && vehicle.model && (
                          <span className="text-outline text-xs">•</span>
                        )}
                        {vehicle.model && (
                          <span className="text-xs text-on-surface-variant">{vehicle.model}</span>
                        )}
                        {(vehicle.brand || vehicle.model) && vehicle.color && (
                          <span className="text-outline text-xs">•</span>
                        )}
                        {vehicle.color && (
                          <span className="text-xs text-on-surface-variant">{vehicle.color}</span>
                        )}
                        {!vehicle.brand && !vehicle.model && !vehicle.color && (
                          <span className="text-xs text-on-surface-variant italic">Sin detalles</span>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-primary text-lg shrink-0">
                      arrow_forward
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
