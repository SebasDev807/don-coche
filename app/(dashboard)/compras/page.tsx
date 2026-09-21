import { Metadata } from 'next';
import { getPurchaseInvoicesAction } from '@/actions/purchases/purchases.actions';
import Link from 'next/link';


export const metadata: Metadata = {
  title: 'Historial de Compras | Don Coche',
  description: 'Historial de facturas de proveedores.',
};

export default async function ComprasPage() {
  const result = await getPurchaseInvoicesAction();
  const invoices = result.success && result.data ? result.data : [];

  return (
    <div className="fade-in flex flex-col min-h-[calc(100vh-140px)]">
      <main className="flex-grow flex flex-col max-w-[1440px] mx-auto w-full">
        {/* Header Section */}
        <header className="mb-stack-lg flex justify-between items-end">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
              Historial de Compras
            </h1>
            <p className="font-body-lg text-body-lg text-secondary">
              Facturas de inventario registradas de proveedores.
            </p>
          </div>
          <Link 
            href="/compras/nueva"
            className="flex items-center gap-2 bg-primary-fixed text-black px-6 py-3 rounded-full hover:brightness-95 transition-colors font-medium shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nueva Factura
          </Link>
        </header>

        {invoices.length === 0 ? (
          <div className="bg-surface-container rounded-2xl p-12 text-center text-secondary">
            No hay facturas de compra registradas aún.
          </div>
        ) : (
          <div className="bg-surface-container rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface border-b border-outline-variant">
                    <th className="p-4 font-medium text-secondary">Fecha</th>
                    <th className="p-4 font-medium text-secondary">Factura #</th>
                    <th className="p-4 font-medium text-secondary">Proveedor</th>
                    <th className="p-4 font-medium text-secondary text-center">Ítems</th>
                    <th className="p-4 font-medium text-secondary text-right">Total</th>
                    <th className="p-4 font-medium text-secondary">Registrado por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {invoices.map((invoice: any) => (
                    <tr key={invoice.id} className="hover:bg-surface/50 transition-colors">
                      <td className="p-4 text-body-md whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-secondary">calendar_month</span>
                          {new Date(invoice.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary">receipt</span>
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-secondary">domain</span>
                          <span className="font-medium">{invoice.supplier.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded-md text-body-sm font-medium">
                          {invoice._count.items}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-title-md">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(invoice.grandTotal)}
                      </td>
                      <td className="p-4 text-body-sm text-secondary">
                        {invoice.admin.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
