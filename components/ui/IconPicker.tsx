'use client';

import { useState, useRef, useEffect } from 'react';
import { UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { ErrorMessage } from './ErrorMessage';
import { CAR_SERVICE_ICONS } from '@/constants/icons';

interface IconPickerProps {
  name: string;
  label: string;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
}

export function IconPicker({ name, label, setValue, watch, errors }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedIcon = watch(name);
  const errorMessage = errors[name]?.message as string | undefined;

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="col-span-1 relative" ref={containerRef}>
      <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">{label}</label>
      
      <div 
        className={`h-[56px] w-full rounded-lg border bg-surface flex items-center justify-between px-4 cursor-pointer transition-shadow ${errorMessage ? 'border-error focus:ring-error' : 'border-outline-variant hover:border-primary focus:ring-primary'} focus:ring-2 outline-none`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <div className="flex items-center gap-3">
          {selectedIcon ? (
            <span className="material-symbols-outlined text-primary text-[24px]">
              {selectedIcon}
            </span>
          ) : (
            <span className="text-secondary-fixed-dim">Selecciona un ícono...</span>
          )}
        </div>
        <span className="material-symbols-outlined text-secondary text-[20px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
        
        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-surface-container-highest border border-outline-variant rounded-xl shadow-lg p-3 z-50 grid grid-cols-5 gap-2">
            {CAR_SERVICE_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setValue(name, icon, { shouldValidate: true });
                  setIsOpen(false);
                }}
                title={icon.replace(/_/g, ' ')}
                className={`flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-primary-container hover:text-on-primary-container ${selectedIcon === icon ? 'bg-primary-container text-on-primary-container' : 'text-on-surface'}`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {icon}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <ErrorMessage message={errorMessage} />
    </div>
  );
}
