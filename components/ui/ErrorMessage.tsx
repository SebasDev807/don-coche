

interface ErrorMessageProps {
  message?: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <span className="text-error text-sm font-body-md mt-1 block">
      {message}
    </span>
  );
}
