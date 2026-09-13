import { verifyRole } from '@/lib/dal';
import { getAlmacenProducts } from '@/actions/almacen/almacen.actions';
import { AlmacenClient } from '@/components/dashboard/almacen/AlmacenClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Don Coche | Almacén',
  description: 'Punto de venta de productos de inventario',
};

export default async function AlmacenPage() {
  await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'AUXILIAR_ADMINISTRATIVO']);

  const productsRes = await getAlmacenProducts();

  return (
    <div className="h-full fade-in flex flex-col">
      <AlmacenClient initialProducts={productsRes.data || []} />
    </div>
  );
}
