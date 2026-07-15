"use client";

import React, { useState, forwardRef } from 'react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  helperText?: string;
}

/**
 * Componente de entrada de contraseña reutilizable.
 * Proporciona un campo de texto con un botón integrado para alternar
 * la visibilidad de la contraseña (texto plano vs oculto).
 * 
 * Está diseñado para ser compatible con `react-hook-form` gracias al uso de `forwardRef`.
 *
 * @param props - Propiedades del input y las extendidas de HTMLInputElement
 * @param props.label - Etiqueta a mostrar encima del campo
 * @param props.error - Indica si hay un error visual asociado (opcional)
 * @param props.helperText - Texto de ayuda adicional para el input (opcional)
 * @param ref - Referencia retransmitida al elemento input HTML
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative w-full">
        <label className="block font-label-bold text-label-bold text-on-surface mb-2" htmlFor={props.id}>
          {label}
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10 pointer-events-none">
            lock
          </span>
          <input
            {...props}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={`w-full h-touch-target-min pl-12 pr-12 bg-white border border-outline-variant rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim focus:border-primary-fixed-dim transition-colors ${className}`}
            style={{ backgroundColor: 'white' }}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-2 flex items-center justify-center cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password visibility"
          >
            <span className="material-symbols-outlined">
              {showPassword ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';
