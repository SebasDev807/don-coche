import { Metadata } from 'next';
import { verifyRole } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { getSuppliersAction } from '@/actions/suppliers/suppliers.actions';
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
  const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'AUXILIAR_ADMINISTRATIVO']);

  const [suppliersRes, categoriesRes, invoiceRes, rawProducts] = await Promise.all([
    getSuppliersAction(),
    getCategories(),
    getPurchaseInvoiceByIdAction(id),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  ]);

  if (!invoiceRes.success || !invoiceRes.data) {
    notFound();
  }

  const suppliers = suppliersRes.success && suppliersRes.data ? suppliersRes.data : [];
  const products = rawProducts.map(p => ({
    id: p.id,
    name: p.name,
    barCode: p.barCode,
    unitCost: Number(p.unitCost),
    salePrice: Number(p.salePrice),
    iva: p.iva != null ? Number(p.iva) : 19,
    profitPercentage: p.profitPercentage ? Number(p.profitPercentage) : 0,
    categoryId: p.categoryId,
  }));
  const categories = categoriesRes || [];

  const invoice = invoiceRes.data;
  const serializedInvoice = {
    ...invoice,
    totalBase: Number(invoice.totalBase || 0),
    discounts: Number(invoice.discounts || 0),
    subtotal: Number(invoice.subtotal || 0),
    ivaAmount: Number(invoice.ivaAmount || 0),
    grandTotal: Number(invoice.grandTotal || 0),
    items: invoice.items.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity || 0),
      unitCost: Number(item.unitCost || 0),
      discountPercentage: Number(item.discountPercentage || 0),
      subtotal: Number(item.subtotal || 0),
      product: item.product ? {
        ...item.product,
        unitCost: Number(item.product.unitCost || 0),
        salePrice: Number(item.product.salePrice || 0),
        iva: item.product.iva != null ? Number(item.product.iva) : 19,
        profitPercentage: item.product.profitPercentage ? Number(item.product.profitPercentage) : 0,
      } : undefined
    }))
  };

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
          initialInvoice={serializedInvoice}
          initialSuppliers={suppliers}
          products={products}
          categories={categories}
          adminId={session.userId}
        />
      </main>
    </div>
  );
}
