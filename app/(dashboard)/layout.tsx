/**
 * @fileoverview Layout del área de gestión (dashboard).
 *
 * Server Component que verifica la sesión usando el DAL antes de renderizar.
 * Si el usuario no tiene sesión o el rol no es permitido, el DAL redirige
 * automáticamente a `/auth` antes de que cualquier HTML sea enviado al cliente.
 *
 * Este layout envuelve automáticamente a todas las páginas hijas
 * bajo la ruta `/dashboard/*`.
 */

import { verifyRole } from '@/lib/dal';
import { logoutAction } from '@/app/auth/actions';
import { Sidebar, Navbar, MobileBottomNav } from '@/components/dashboard';

/** Roles que tienen acceso al área de gestión. */
const ALLOWED_ROLES = ['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR'];

/**
 * Layout principal del dashboard.
 *
 * Estructura flex con sidebar fijo a la izquierda (desktop),
 * área principal con navbar superior y contenido scrollable,
 * y bottom nav en mobile.
 *
 * @param props - Children renderizados por Next.js (la página activa).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificación server-side: redirige a /auth si no hay sesión o rol no permitido
  const user = await verifyRole(ALLOWED_ROLES);

  return (
    <div className="fade-in bg-background text-on-background font-body-md antialiased overflow-hidden flex h-screen">
      {/* Sidebar (solo desktop) */}
      <Sidebar logoutAction={logoutAction} />

      {/* Área de contenido principal */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
        {/* Navbar superior */}
        <Navbar user={user} />

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom nav (solo mobile) */}
      <MobileBottomNav />
    </div>
  );
}
