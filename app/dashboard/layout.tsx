/**
 * @fileoverview Layout del área de gestión (dashboard).
 *
 * Protege el acceso verificando que el usuario tenga rol `GERENTE` o
 * `ADMINISTRADOR` mediante el hook `useRequireRole`. Renderiza la
 * estructura principal: Sidebar + Navbar + contenido + MobileBottomNav.
 *
 * Este layout envuelve automáticamente a todas las páginas hijas
 * bajo la ruta `/dashboard/*`.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useRequireRole } from '@/hooks/useRequireRole';
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
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const { isLoading, isAuthorized, user } = useRequireRole(ALLOWED_ROLES);

  /** Cierra la sesión y redirige al login. */
  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  // Prevenir flash de contenido durante hidratación o acceso no autorizado
  if (isLoading || !isAuthorized || !user) return null;

  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-hidden flex h-screen">
      {/* Sidebar (solo desktop) */}
      <Sidebar onLogout={handleLogout} />

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
