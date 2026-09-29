import { verifyRole } from '@/lib/dal';
import { getAlmacenProducts } from '@/actions/almacen/almacen.actions';
import { AlmacenClient } from '@/components/dashboard/almacen/AlmacenClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Don Coche | Pista',
  description: 'Punto de venta y servicios para técnicos',
};

export default async function PistaPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Solo los técnicos (y superiores) pueden acceder a la pista
  await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'AUXILIAR_ADMINISTRATIVO', 'TECNICO']);

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
      <AlmacenClient 
        initialProducts={productsRes.data || []} 
        prefillData={prefillData} 
        hideStock={true} 
      />
    </div>
  );
}
