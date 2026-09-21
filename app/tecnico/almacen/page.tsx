import { verifyRole } from '@/lib/dal';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { logoutAction } from '@/actions/auth.actions';
import { Header } from '@/components/tecnico/Header';
import { getAlmacenProducts } from '@/actions/almacen/almacen.actions';
import { AlmacenClient } from '@/components/dashboard/almacen/AlmacenClient';
import { GlobalReleaseModal } from '@/components/dashboard/releases/GlobalReleaseModal';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Don Coche | Punto de Venta (Técnico)',
};

export default async function TecnicoAlmacenPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await verifyRole(['TECNICO', 'SUPERUSUARIO']);
  const sessionPayload = await getSession();
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { department: true }
  });

  const productsRes = await getAlmacenProducts();
  
  const prefillData = {
    plate: typeof searchParams.plate === 'string' ? searchParams.plate : undefined,
    customerName: typeof searchParams.name === 'string' ? searchParams.name : undefined,
    customerCc: typeof searchParams.cc === 'string' ? searchParams.cc : undefined,
    customerPhone: typeof searchParams.phone === 'string' ? searchParams.phone : undefined,
  };

  return (
    <div className="fade-in bg-background text-on-background h-screen flex flex-col font-[family-name:var(--font-sora)] overflow-hidden">
      <Header
        technicianName={user.name}
        logoutAction={logoutAction}
        userDepartment={dbUser?.department}
        activeUserId={sessionPayload?.userId}
        availableUsers={sessionPayload?.users || []}
        activePath="/tecnico/almacen"
      />
      <main className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <AlmacenClient initialProducts={productsRes.data || []} hideServicesTab={true} prefillData={prefillData} />
      </main>
      <GlobalReleaseModal />
    </div>
  );
}
