/**
 * @fileoverview Pantalla principal de la vista del técnico.
 *
 * Server Component que verifica la sesión y el rol antes de renderizar.
 * Solo accesible por usuarios con rol TECNICO o SUPERUSUARIO.
 *
 * El logout se ejecuta vía Server Action pasado como prop al Header.
 */

import { verifyRole } from '@/lib/dal';
import { logoutAction } from '@/app/auth/actions';
import { Header } from '../../components/tecnico/Header';
import { TecnicoWorkspace } from '../../components/tecnico/TecnicoWorkspace';
import { getServices } from '@/actions/car_services';

export default async function TecnicoScreen() {
  // Verifica sesión y rol en el servidor; redirige a /auth si no autorizado
  const user = await verifyRole(['TECNICO', 'SUPERUSUARIO']);

  const { data: services } = await getServices({ limit: 100 });

  return (
    <div className="fade-in bg-gray-50 h-screen flex flex-col font-[family-name:var(--font-sora)] overflow-hidden">
      <Header
        technicianName={user.name}
        logoutAction={logoutAction}
      />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <TecnicoWorkspace catalogServices={services || []} />
      </main>
    </div>
  );
}
