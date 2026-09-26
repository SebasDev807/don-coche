'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  size?: 'sm' | 'md';
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  required = false,
  className = "",
  disabled = false,
  size = "md"
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: rect.width,
        width: 'max-content',
        maxWidth: `calc(100vw - ${rect.left + 16}px)`,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dropdownContent = isOpen && !disabled && (
    <div 
      ref={dropdownRef}
      className="fixed z-[9999] bg-surface rounded-xl shadow-lg border border-outline-variant max-h-60 overflow-y-auto overflow-x-hidden fade-in"
      style={dropdownStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 bg-surface p-2 border-b border-outline-variant z-10">
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
          />
        </div>
      </div>
      
      <ul className="p-1">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <li
              key={option.value}
              className={`px-4 py-2 hover:bg-surface-container rounded-lg cursor-pointer text-sm whitespace-normal break-words leading-relaxed ${
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
        className={`w-full flex items-center justify-between ${size === 'sm' ? 'p-2 rounded-lg' : 'p-3 rounded-xl'} border border-outline-variant bg-surface-container transition-colors ${
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

      {typeof document !== 'undefined' && dropdownContent ? createPortal(dropdownContent, document.body) : null}
    </div>
  );
}

