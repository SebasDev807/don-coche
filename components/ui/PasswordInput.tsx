"use client";

import React, { useState, forwardRef } from 'react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  helperText?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative w-full">
        <label className="block font-label-bold text-label-bold text-on-surface mb-2" htmlFor={props.id}>
          {label}
        </label>
        <div className="relative">
          <input
            {...props}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={`w-full h-touch-target-min px-4 bg-white border border-outline-variant rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim focus:border-primary-fixed-dim transition-colors pr-12 ${className}`}
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
