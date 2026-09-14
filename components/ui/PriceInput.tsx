'use client';

import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { ErrorMessage } from './ErrorMessage';
import { parseLocalizedNumber } from '@/lib/utils/parseLocalizedNumber';

interface PriceInputProps {
  name: string;
  label: string;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  placeholder?: string;
  className?: string;
}

export function PriceInput({ 
  name, 
  label, 
  register, 
  setValue, 
  errors, 
  placeholder = '0',
  className = ''
}: PriceInputProps) {

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Solo formatea cuando el usuario sale del campo
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw.trim()) return;
    const num = parseLocalizedNumber(raw);
    if (num > 0) {
      setValue(name, formatNumber(num), { shouldValidate: true });
    }
  };

  const errorMessage = errors[name]?.message as string | undefined;

  return (
    <div className={`col-span-1 ${className}`}>
      <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">
        {label}
      </label>
      <input
        {...register(name)}
        className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errorMessage ? 'border-error focus:border-error focus:ring-error' : ''}`}
        placeholder={placeholder}
        type="text"
        inputMode="decimal"
        onBlur={handleBlur}
      />
      <ErrorMessage message={errorMessage} />
    </div>
  );
}
