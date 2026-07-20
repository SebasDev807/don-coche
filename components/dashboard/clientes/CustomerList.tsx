'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/ui';

interface CustomerListProps {
  customers: any[];
}

export function CustomerList({ customers }: CustomerListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('selected');

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('selected', id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col h-full bg-surface border-r border-outline-variant/50">
      <div className="p-4 border-b border-outline-variant/50">
        <SearchBar paramName="q" placeholder="Buscar cliente (nombre, email, tel)..." className="w-full" />
      </div>

      <div className="flex-grow overflow-y-auto">
        {customers.length === 0 ? (
          <div className="p-8 text-center text-secondary">
            No se encontraron clientes.
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {customers.map((customer) => (
              <li key={customer.id}>
                <button
                  onClick={() => handleSelect(customer.id)}
                  className={`w-full text-left flex items-center p-4 transition-colors hover:bg-surface-container-high focus:outline-none focus:bg-surface-container-highest ${
                    selectedId === customer.id ? 'bg-surface-container-high border-l-4 border-primary' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-sm uppercase flex-shrink-0">
                    {customer.name ? customer.name.charAt(0) : '?'}
                  </div>
                  <div className="ml-4 truncate">
                    <p className="font-label-lg text-on-surface truncate">{customer.name || 'Sin Nombre'}</p>
                    <p className="font-body-sm text-secondary truncate">
                      {customer.phone || 'Sin teléfono'} • {customer.vehicles?.length || 0} Vehículos
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
