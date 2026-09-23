import { Metadata } from 'next';
import { verifyRole } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { getSuppliersAction } from '@/actions/suppliers/suppliers.actions';
import { getCategories } from '@/actions/inventory/core.actions';
import { NuevaCompraClient } from './NuevaCompraClient';

export const metadata: Metadata = {
  title: 'Nueva Factura de Compra | Don Coche',
  description: 'Registrar nueva factura de proveedor',
};

export default async function NuevaCompraPage() {
  const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'AUXILIAR_ADMINISTRATIVO']);

  const [suppliersRes, categoriesRes, rawProducts] = await Promise.all([
    getSuppliersAction(),
    getCategories(),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  ]);

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

  return (
    <div className="fade-in flex flex-col min-h-[calc(100vh-140px)]">
      <main className="flex-grow flex flex-col max-w-[1440px] mx-auto w-full">
        {/* Header Section */}
        <header className="mb-stack-lg">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            Registrar Factura de Compra
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">
            Ingrese los detalles de la factura y los productos para actualizar el inventario.
          </p>
        </header>

        <NuevaCompraClient 
          initialSuppliers={suppliers} 
          products={products} 
          categories={categories}
          adminId={session.userId} 
        />
      </main>
    </div>
  );
}
