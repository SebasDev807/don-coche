/**
 * @fileoverview Navbar superior (TopAppBar) del área de gestión.
 *
 * Muestra en mobile el título "DON COCHE" y en desktop el nombre
 * del usuario activo, su rol como badge, la fecha actual,
 * un botón de notificaciones y un avatar circular con la inicial.
 *
 * Reutilizable para todas las pantallas del dashboard.
 */

'use client';

import type { User } from '@/store/useAuthStore';

/**
 * Props del componente Navbar.
 */
interface NavbarProps {
  /** Datos del usuario autenticado activo. */
  user: User;
}

/**
 * Formatea la fecha actual en formato legible (ej: "24 Oct, 2023").
 *
 * @returns Cadena de texto con la fecha formateada.
 */
function getFormattedDate(): string {
  const now = new Date();
  return now.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Extrae la primera letra (mayúscula) del nombre del usuario
 * para usar como avatar.
 *
 * @param name - Nombre completo del usuario.
 * @returns Inicial en mayúscula.
 */
function getUserInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

/**
 * Mapea el rol técnico a un nombre legible para mostrar en el badge.
 *
 * @param role - Rol del usuario tal como viene del store.
 * @returns Etiqueta legible del rol.
 */
function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPERUSUARIO: 'Superusuario',
    GERENTE: 'Gerente',
    ADMINISTRADOR: 'Administrador',
    TECNICO: 'Técnico',
  };
  return labels[role] ?? role;
}

/**
 * Barra de navegación superior del dashboard.
 *
 * Incluye zona de usuario con nombre, rol, fecha, notificaciones y avatar.
 *
 * @param props - {@link NavbarProps}
 */
export function Navbar({ user }: NavbarProps) {
  const formattedDate = getFormattedDate();
  const initial = getUserInitial(user.name);
  const roleLabel = getRoleLabel(user.role);

  return (
    <header className="bg-surface-container-lowest border-b border-surface-variant flex justify-between items-center w-full px-6 h-touch-target-min min-h-[72px] shrink-0 relative z-10">
      {/* Mobile: Título */}
      <div className="flex items-center lg:hidden">
        <span className="font-display-lg text-headline-lg-mobile font-black tracking-tighter text-on-surface">
          DON COCHE
        </span>
      </div>

      {/* Desktop: Espacio de búsqueda (futuro) */}
      <div className="hidden lg:flex flex-1 max-w-xl relative group">
        <div className="relative w-full max-w-md" />
      </div>

      {/* Zona derecha: info usuario + acciones */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Info del usuario (solo desktop) */}
          <div className="hidden md:flex flex-col items-end mr-2">
            <p className="font-label-bold text-sm text-on-surface">{user.name}</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">
              {roleLabel}
            </p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">
              {formattedDate}
            </p>
          </div>

          {/* Notificaciones */}
          <button
            className="relative p-2 text-on-surface hover:bg-surface-variant rounded-full transition-colors active:scale-95 cursor-pointer"
            aria-label="Notificaciones"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface-container-lowest" />
          </button>

          {/* Avatar circular con inicial */}
          <button
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-primary-container text-on-surface font-label-bold text-sm hover:bg-primary-fixed-dim transition-colors active:scale-95 cursor-pointer"
            aria-label="Perfil de usuario"
          >
            {initial}
          </button>
        </div>
      </div>
    </header>
  );
}
