import { Metadata } from 'next';
import { verifyRole } from '@/lib/dal';
import { getPaginatedSuppliersAction } from '@/actions/suppliers/suppliers.actions';
import ProveedoresPageClient from './ProveedoresPageClient';

export const metadata: Metadata = {
  title: 'Proveedores | Don Coche',
  description: 'Gestión de proveedores',
};

export default async function ProveedoresPage(props: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const searchParams = await props.searchParams;
  await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'AUXILIAR_ADMINISTRATIVO']);

  const query = searchParams.q || '';
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = 10;

  const res = await getPaginatedSuppliersAction(query, currentPage, pageSize);

  const initialSuppliers = res.success && res.data ? res.data : [];
  const totalPages = res.success && res.totalPages ? res.totalPages : 1;
  const totalCount = res.success && res.totalCount ? res.totalCount : 0;

  return (
    <div className="fade-in flex flex-col min-h-[calc(100vh-140px)]">
      <main className="flex-grow flex flex-col max-w-[1440px] mx-auto w-full">
        <header className="mb-stack-lg">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            Proveedores
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">
            Administre la lista de proveedores del sistema.
          </p>
        </header>

        <ProveedoresPageClient 
          initialSuppliers={initialSuppliers}
          totalPages={totalPages}
          currentPage={currentPage}
          totalCount={totalCount}
        />
      </main>
    </div>
  );
}
