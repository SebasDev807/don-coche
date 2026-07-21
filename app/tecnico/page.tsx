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
import { logoutAction } from '@/app/auth/actions';
import { Header } from '../../components/tecnico/Header';
import { TecnicoWorkspace } from '../../components/tecnico/TecnicoWorkspace';
import { getServices } from '@/actions/car_services';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Don Coche | Técnico',
};

export default async function TecnicoScreen() {
  // Verifica sesión y rol en el servidor; redirige a /auth si no autorizado
  const user = await verifyRole(['TECNICO', 'SUPERUSUARIO']);
  
  // Obtener departamento del usuario si es técnico
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { department: true }
  });

  const { data: services } = await getServices({ limit: 100 });

  return (
    <div className="fade-in bg-gray-50 h-screen flex flex-col font-[family-name:var(--font-sora)] overflow-hidden">
      <Header
        technicianName={user.name}
        logoutAction={logoutAction}
      />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <TecnicoWorkspace catalogServices={services || []} userDepartment={dbUser?.department} />
      </main>
    </div>
  );
}
