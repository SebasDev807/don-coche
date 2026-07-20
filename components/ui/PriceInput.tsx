import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { ErrorMessage } from './ErrorMessage';

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
  
  const formatCurrencyValue = (val: string) => {
    const rawValue = val.replace(/\D/g, '');
    if (!rawValue) return '';
    return new Intl.NumberFormat('es-CO').format(parseInt(rawValue, 10));
  };

  const errorMessage = errors[name]?.message as string | undefined;

  return (
    <div className={`col-span-1 ${className}`}>
      <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">{label}</label>
      <input
        {...register(name)}
        className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errorMessage ? 'border-error focus:border-error focus:ring-error' : ''}`}
        placeholder={placeholder}
        type="text"
        onChange={(e) => {
          setValue(name, formatCurrencyValue(e.target.value), { shouldValidate: true });
        }}
      />
      <ErrorMessage message={errorMessage} />
    </div>
  );
}
