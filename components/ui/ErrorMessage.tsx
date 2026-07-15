

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
    <span className="text-error text-sm font-body-md mt-1 block">
      {message}
    </span>
  );
}
