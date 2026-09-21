import { verifyRole } from '@/lib/dal';
import { getAlmacenProducts } from '@/actions/almacen/almacen.actions';
import { AlmacenClient } from '@/components/dashboard/almacen/AlmacenClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Don Coche | Almacén',
  description: 'Punto de venta de productos de inventario',
};

export default async function AlmacenPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'AUXILIAR_ADMINISTRATIVO']);

  const productsRes = await getAlmacenProducts();
  
  // Extract prefill data from query params
  const prefillData = {
    plate: typeof searchParams.plate === 'string' ? searchParams.plate : undefined,
    customerName: typeof searchParams.name === 'string' ? searchParams.name : undefined,
    customerCc: typeof searchParams.cc === 'string' ? searchParams.cc : undefined,
    customerPhone: typeof searchParams.phone === 'string' ? searchParams.phone : undefined,
  };

  return (
    <div className="h-full fade-in flex flex-col">
      <AlmacenClient initialProducts={productsRes.data || []} prefillData={prefillData} />
    </div>
  );
}
