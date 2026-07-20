'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  paramName?: string;
  debounceMs?: number;
}

export function SearchBar({
  placeholder = 'Buscar...',
  className = '',
  paramName = 'q',
  debounceMs = 300,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get(paramName) || '');
  const searchParamsRef = useRef(searchParams);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      if (searchTerm) {
        params.set(paramName, searchTerm);
      } else {
        params.delete(paramName);
      }
      
      // Reseteamos a la página 1 cuando buscamos algo nuevo para evitar resultados vacíos
      if (params.has('page') && searchParamsRef.current.get(paramName) !== searchTerm) {
        params.set('page', '1');
      }
      
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, debounceMs);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, pathname, router, paramName, debounceMs]);

  return (
    <div className={`relative ${className}`}>
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
      <input
        className="w-full h-touch-target-min pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md text-on-surface outline-none transition-colors"
        placeholder={placeholder}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}
