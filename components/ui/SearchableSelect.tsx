'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  required = false,
  className = "",
  disabled = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hidden select for native form validation if required */}
      {required && (
        <select
          value={value}
          onChange={() => {}}
          className="absolute opacity-0 w-0 h-0"
          required={required}
          tabIndex={-1}
        >
          <option value=""></option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      <div
        className={`w-full flex items-center justify-between p-3 rounded-xl border border-outline-variant bg-surface-container transition-colors ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer focus-within:border-primary'
        }`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) setSearchTerm("");
          }
        }}
      >
        <div className="flex-1 truncate text-body-md text-on-surface">
          {selectedOption ? selectedOption.label : <span className="text-secondary">{placeholder}</span>}
        </div>
        <span className="material-symbols-outlined text-secondary ml-2 text-[20px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-surface rounded-xl shadow-lg border border-outline-variant max-h-60 overflow-y-auto overflow-x-hidden fade-in">
          <div className="sticky top-0 bg-surface p-2 border-b border-outline-variant">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-[18px]">
                search
              </span>
              <input
                type="text"
                autoFocus
                className="w-full pl-9 pr-3 py-2 bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="Escribe para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <ul className="p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  className={`px-4 py-2 hover:bg-surface-container rounded-lg cursor-pointer text-sm truncate ${
                    option.value === value ? 'bg-primary-container/50 text-primary font-medium' : 'text-on-surface'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-secondary text-sm text-center">
                No se encontraron resultados
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
