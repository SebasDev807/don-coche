

interface ErrorMessageProps {
  message?: string;
}

/**
 * Componente que muestra un mensaje de error de validación de formularios.
 * Si no se provee un mensaje, el componente no renderiza nada.
 * 
 * @param props - Propiedades del componente
 * @param props.message - Texto del error a mostrar (opcional)
 */
export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="bg-error-container text-error text-sm font-body-md mt-2 p-2 rounded flex items-center justify-center gap-2">
      <span className="material-symbols-outlined text-base">warning</span>
      <span>{message}</span>
    </div>
  );
}
