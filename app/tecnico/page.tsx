/**
 * @fileoverview Pantalla principal de la vista del técnico.
 *
 * Server Component que verifica la sesión y el rol antes de renderizar.
 * Solo accesible por usuarios con rol TECNICO o SUPERUSUARIO.
 *
 * El logout se ejecuta vía Server Action pasado como prop al Header.
 */

import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/dal';
import { getSession } from '@/lib/session';
import { logoutAction } from '@/actions/auth.actions';
import { Header } from '../../components/tecnico/Header';
import { TecnicoWorkspace } from '../../components/tecnico/TecnicoWorkspace';
import { getServices } from '@/actions/car_services';
import { Metadata } from 'next';
import { GlobalReleaseModal } from '@/components/dashboard/releases/GlobalReleaseModal';

export const metadata: Metadata = {
  title: 'Don Coche | Técnico',
};

export default async function TecnicoScreen() {
  // Verifica sesión y rol en el servidor; redirige a /auth si no autorizado
  const user = await verifyRole(['TECNICO', 'SUPERUSUARIO']);
  
  // Obtener payload completo de la sesión para el AccountSwitcher
  const sessionPayload = await getSession();
  
  // Obtener departamento del usuario si es técnico
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { department: true }
  });

  const { data: services } = await getServices({ limit: 100 });

  const insumos = await prisma.product.findMany({
    where: {
      isActive: true,
      category_rel: {
        name: {
          equals: 'Insumos',
          mode: 'insensitive'
        }
      }
    },
    select: {
      id: true,
      name: true,
      stock: true,
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="fade-in bg-background text-on-background h-screen flex flex-col font-[family-name:var(--font-sora)] overflow-hidden">
      <Header
        technicianName={user.name}
        logoutAction={logoutAction}
        userDepartment={dbUser?.department}
        activeUserId={sessionPayload?.userId}
        availableUsers={sessionPayload?.users || []}
      />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <TecnicoWorkspace catalogServices={services || []} userDepartment={dbUser?.department} insumos={insumos} />
      </main>
      <GlobalReleaseModal />
    </div>
  );
}
