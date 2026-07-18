'use client';

interface ExportExcelButtonProps {
  /**
   * Función callback que se ejecuta al hacer clic en el botón para iniciar la exportación.
   */
  onClick?: () => void;
  /**
   * Indica si la exportación está en proceso para mostrar un estado de carga.
   * Deshabilita el botón y muestra un spinner de carga.
   */
  isLoading?: boolean;
  /**
   * Indica si el botón debe estar deshabilitado.
   */
  disabled?: boolean;
  /**
   * Clases CSS adicionales para personalizar el contenedor del botón.
   */
  className?: string;
  /**
   * Texto alternativo o etiqueta del botón. Por defecto es 'Exportar a Excel'.
   */
  label?: string;
}

/**
 * Componente de botón reutilizable para exportar datos a formato Excel.
 * 
 * Diseñado bajo el sistema de diseño del proyecto, adaptando un estilo visual
 * que evoca la marca Excel con interacciones suaves de transición y micro-animaciones.
 * 
 * @param props - Propiedades del componente.
 * @returns {JSX.Element} Botón interactivo con estados de carga y deshabilitado.
 */
export function ExportExcelButton({
  onClick,
  isLoading = false,
  disabled = false,
  className = '',
  label = 'Exportar a Excel',
}: ExportExcelButtonProps) {
  const isBtnDisabled = disabled || isLoading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isBtnDisabled}
      className={`
        group cursor-pointer h-touch-target-min px-6 
        border border-outline-variant bg-surface-container-lowest 
        text-on-surface font-cta text-cta rounded-lg 
        hover:bg-emerald-50/55 hover:border-emerald-500 hover:text-emerald-700 
        disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface-container-lowest 
        disabled:hover:border-outline-variant disabled:hover:text-on-surface
        transition-all flex items-center gap-2 shadow-sm flex-1 lg:flex-none justify-center 
        active:scale-[0.98]
        ${className}
      `}
      aria-label={label}
    >
      {isLoading ? (
        <svg 
          className="animate-spin h-5 w-5 text-emerald-600" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <span className="material-symbols-outlined text-emerald-600 group-hover:text-emerald-700 transition-colors">
          file_download
        </span>
      )}
      <span>{label}</span>
    </button>
  );
}
