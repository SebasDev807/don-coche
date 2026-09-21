import { Metadata } from 'next';
import { verifyRole } from '@/lib/dal';
import { getSuppliersAction } from '@/actions/suppliers/suppliers.actions';
import { getAlmacenProducts } from '@/actions/almacen/almacen.actions';
import { getCategories } from '@/actions/inventory/core.actions';
import { getPurchaseInvoiceByIdAction } from '@/actions/purchases/purchases.actions';
import { notFound } from 'next/navigation';
import { EditarCompraClient } from './EditarCompraClient';

export const metadata: Metadata = {
  title: 'Editar Factura de Compra | Don Coche',
  description: 'Editar una factura de proveedor existente',
};

export default async function EditarCompraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

  const [suppliersRes, productsRes, categoriesRes, invoiceRes] = await Promise.all([
    getSuppliersAction(),
    getAlmacenProducts(),
    getCategories(),
    getPurchaseInvoiceByIdAction(id)
  ]);

  if (!invoiceRes.success || !invoiceRes.data) {
    notFound();
  }

  const suppliers = suppliersRes.success && suppliersRes.data ? suppliersRes.data : [];
  const products = productsRes.success && productsRes.data ? productsRes.data : [];
  const categories = categoriesRes || [];

  return (
    <div className="fade-in flex flex-col min-h-[calc(100vh-140px)]">
      <main className="flex-grow flex flex-col max-w-[1440px] mx-auto w-full">
        <header className="mb-stack-lg">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            Editar Factura de Compra
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">
            Modifique los detalles de la factura. Los cambios afectarán automáticamente el inventario.
          </p>
        </header>

        <EditarCompraClient
          initialInvoice={invoiceRes.data}
          initialSuppliers={suppliers}
          products={products}
          categories={categories}
          adminId={session.userId}
        />
      </main>
    </div>
  );
}
