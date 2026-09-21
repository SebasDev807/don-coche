import { Metadata } from 'next';
import { getPurchaseInvoicesAction } from '@/actions/purchases/purchases.actions';
import Link from 'next/link';
import { ComprasClient } from './ComprasClient';
import { verifyRole } from '@/lib/dal';

export const metadata: Metadata = {
  title: 'Historial de Compras | Don Coche',
  description: 'Historial de facturas de proveedores.',
};

export default async function ComprasPage() {
  await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'AUXILIAR_ADMINISTRATIVO']);
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
          <ComprasClient invoices={invoices} />
        )}
      </main>
    </div>
  );
}
