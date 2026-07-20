import { Metadata } from 'next';
import { getCustomers } from '@/actions/customers';
import { ClientesPageClient } from './ClientesPageClient';

export const metadata: Metadata = {
  title: 'Directorio de Clientes | Don Coche',
  description: 'Gestione clientes y sus vehículos.',
};

export default async function ClientesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const selectedId = typeof searchParams.selected === 'string' ? searchParams.selected : undefined;

  const { data: customers } = await getCustomers({ query });

  return (
    <div className="fade-in flex flex-col min-h-[calc(100vh-140px)]">
      <main className="flex-grow flex flex-col max-w-[1440px] mx-auto w-full">
        {/* Header Section */}
        <header className="mb-stack-lg">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            Directorio de Clientes
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">
            Administre los perfiles de los clientes y el garaje de vehículos de cada uno.
          </p>
        </header>

        {/* Master/Detail Container */}
        <ClientesPageClient 
          customers={customers || []} 
          selectedId={selectedId} 
        />
      </main>
    </div>
  );
}
