'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { searchCustomersByCc } from '@/actions/customers/core.actions';

export interface VehicleInfo {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  color: string | null;
}

export interface CustomerSuggestion {
  id: string;
  cc: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  vehicles: VehicleInfo[];
}

interface CustomerSearchBarProps {
  onSelectCustomer: (customer: CustomerSuggestion) => void;
}

export function CustomerSearchBar({ onSelectCustomer }: CustomerSearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(async () => {
      const res = await searchCustomersByCc(trimmed);
      if (res.success && res.data) {
        setSuggestions(res.data as CustomerSuggestion[]);
        setIsOpen(res.data.length > 0);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
      setIsLoading(false);
    }, 400);

    return () => {
      clearTimeout(timer);
      setIsLoading(false);
    };
  }, [query]);

  const handleSelect = useCallback((customer: CustomerSuggestion) => {
    onSelectCustomer(customer);
    setSelectedLabel(`${customer.cc} — ${customer.name || 'Sin nombre'}`);
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  }, [onSelectCustomer]);

  const handleClear = useCallback(() => {
    setSelectedLabel('');
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
        <span className="material-symbols-outlined text-sm align-middle mr-1">person_search</span>
        Buscar Cliente Existente
      </label>

      {/* Selected customer badge */}
      {selectedLabel ? (
        <div className="flex items-center gap-2 bg-primary-container/20 border border-primary-container rounded-lg py-3 px-4">
          <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
          <span className="text-sm font-medium text-on-surface flex-1 truncate">{selectedLabel}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-on-surface-variant hover:text-error transition-colors cursor-pointer"
            aria-label="Limpiar selección"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
              search
            </span>
            <input
              className="block w-full pl-10 pr-4 py-3 bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm focus:border-primary focus:ring-1 focus:ring-primary text-base text-on-surface placeholder-on-surface-variant/60 outline-none transition-all cursor-pointer"
              placeholder="Ingrese la cédula del cliente..."
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Suggestions dropdown */}
          {isOpen && suggestions.length > 0 && (
            <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg overflow-hidden animate-[fadeIn_0.15s_ease-out]">
              {suggestions.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors text-left cursor-pointer"
                    onClick={() => handleSelect(customer)}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-xl shrink-0">
                      person
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface tabular-nums">
                          {customer.cc}
                        </span>
                        <span className="text-outline text-xs">•</span>
                        <span className="text-sm text-on-surface truncate">
                          {customer.name || 'Sin nombre'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {customer.phone && (
                          <span className="text-xs text-on-surface-variant">
                            Tel: {customer.phone}
                          </span>
                        )}
                        {customer.vehicles.length > 0 && (
                          <>
                            {customer.phone && <span className="text-outline text-xs">•</span>}
                            <span className="text-xs text-on-surface-variant">
                              {customer.vehicles.length} vehículo{customer.vehicles.length > 1 ? 's' : ''}
                            </span>
                          </>
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

          {/* No results message */}
          {isOpen && suggestions.length === 0 && !isLoading && query.trim().length >= 3 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg p-4 text-center">
              <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-1 block">person_off</span>
              <p className="text-sm text-on-surface-variant">No se encontraron clientes con esa cédula</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
