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
    let clean = val.replace(/[^\d.,]/g, '');
    clean = clean.replace(/\./g, ''); // Remover puntos de miles
    clean = clean.replace(',', '.');  // Cambiar coma por punto para parsear
    
    const parts = clean.split('.');
    if (parts.length > 2) {
      clean = parts[0] + '.' + parts.slice(1).join('');
    }
    if (!clean) return '';
    
    if (clean.endsWith('.')) {
      const whole = clean.slice(0, -1);
      return new Intl.NumberFormat('es-CO').format(parseInt(whole || '0', 10)) + ',';
    }

    const numberValue = parseFloat(clean);
    if (isNaN(numberValue)) return '';
    
    let fractionDigits = 0;
    if (clean.includes('.')) {
      fractionDigits = Math.min(clean.split('.')[1].length, 2);
    }
    
    return new Intl.NumberFormat('es-CO', { 
      maximumFractionDigits: 2,
      minimumFractionDigits: fractionDigits
    }).format(numberValue);
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
