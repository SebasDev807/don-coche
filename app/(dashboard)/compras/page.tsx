import { Metadata } from 'next';
import { getPurchaseInvoicesAction } from '@/actions/purchases/purchases.actions';
import Link from 'next/link';
import { ComprasClient } from './ComprasClient';
import { verifyRole } from '@/lib/dal';
import { SearchBar } from '@/components/ui/SearchBar';

export const metadata: Metadata = {
  title: 'Historial de Compras | Don Coche',
  description: 'Historial de facturas de proveedores.',
};

export default async function ComprasPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'AUXILIAR_ADMINISTRATIVO']);
  
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  
  const pageParam = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const result = await getPurchaseInvoicesAction(q, currentPage, 6);
  const rawInvoices = result.success && result.data ? result.data : [];
  const totalPages = result.success && result.totalPages ? result.totalPages : 1;
  const totalCount = result.success && result.totalCount ? result.totalCount : 0;

  const buildUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('page', String(newPage));
    return `/compras?${params.toString()}`;
  };
  const invoices = rawInvoices.map(invoice => ({
    ...invoice,
    discountAmount: invoice.discountAmount ? Number(invoice.discountAmount) : 0,
    subtotal: Number(invoice.subtotal || 0),
    ivaAmount: Number(invoice.ivaAmount || 0),
    grandTotal: Number(invoice.grandTotal || 0),
    items: invoice.items?.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity || 0),
      unitCost: Number(item.unitCost || 0),
      subtotal: Number(item.subtotal || 0),
      product: item.product ? {
        ...item.product,
        unitCost: Number(item.product.unitCost || 0),
        salePrice: Number(item.product.salePrice || 0),
        iva: item.product.iva != null ? Number(item.product.iva) : 19,
        profitPercentage: item.product.profitPercentage ? Number(item.product.profitPercentage) : 0,
      } : undefined
    }))
  }));

  return (
    <div className="fade-in flex flex-col min-h-[calc(100vh-140px)]">
      <main className="flex-grow flex flex-col max-w-[1440px] mx-auto w-full">
        {/* Header Section */}
        <header className="mb-stack-lg flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
              Historial de Compras
            </h1>
            <p className="font-body-lg text-body-lg text-secondary">
              Facturas de inventario registradas de proveedores.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <SearchBar placeholder="Buscar factura o proveedor..." className="w-full sm:w-80" />
            <Link 
              href="/compras/nueva"
              className="flex justify-center w-full sm:w-auto items-center gap-2 bg-primary-fixed text-black px-6 py-3 rounded-full hover:brightness-95 transition-colors font-medium shadow-sm cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Nueva Factura
            </Link>
          </div>
        </header>

        {invoices.length === 0 ? (
          <div className="bg-surface-container rounded-2xl p-12 text-center text-secondary">
            No hay facturas de compra registradas aún.
          </div>
        ) : (
          <>
            <ComprasClient invoices={invoices} />
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center bg-surface p-4 rounded-xl shadow-sm border border-surface-variant gap-4">
                <span className="text-sm text-secondary font-medium">
                  Página {currentPage} de {totalPages} · {totalCount} registros
                </span>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <Link
                      href={buildUrl(currentPage - 1)}
                      className="px-4 py-2 border border-outline-variant rounded-lg text-secondary hover:bg-surface-container transition-colors"
                    >
                      Anterior
                    </Link>
                  )}
                  {currentPage < totalPages && (
                    <Link
                      href={buildUrl(currentPage + 1)}
                      className="px-4 py-2 border border-outline-variant rounded-lg text-secondary hover:bg-surface-container transition-colors"
                    >
                      Siguiente
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
