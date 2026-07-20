import React from 'react';
import Link from 'next/link';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  children: React.ReactNode;
}

/**
 * Botón principal reutilizable.
 * Si se proporciona un 'href', renderiza un componente Link de Next.js.
 * De lo contrario, renderiza un botón estándar.
 */
export function PrimaryButton({ href, children, className = '', ...props }: PrimaryButtonProps) {
  const baseClasses = "cursor-pointer h-touch-target-min px-6 bg-primary-container text-[#000000] font-cta text-cta rounded-lg hover:bg-primary-fixed-dim transition-colors flex items-center gap-2 shadow-sm justify-center active:scale-[0.98] whitespace-nowrap";
  const combinedClasses = `${baseClasses} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
