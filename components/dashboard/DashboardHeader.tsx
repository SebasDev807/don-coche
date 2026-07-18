'use client';

import type { VerifiedSession } from '@/lib/dal';

/**
 * Mapea el rol del usuario a una etiqueta visible en el header.
 *
 * @param role - Rol del usuario.
 * @returns Etiqueta en mayúsculas para el subtítulo.
 */
function getRoleSubtitle(role: string): string {
  const labels: Record<string, string> = {
    SUPERUSUARIO: 'SUPERUSUARIO',
    GERENTE: 'GERENTE',
    ADMINISTRADOR: 'ADMINISTRADOR',
  };
  return labels[role] ?? role;
}

/**
 * Props del componente DashboardHeader.
 */
interface DashboardHeaderProps {
  /** Datos del usuario autenticado, provenientes del DAL server-side. */
  user: VerifiedSession;
}

/**
 * Encabezado del dashboard principal que muestra el título y el rol del usuario.
 *
 * @param props - {@link DashboardHeaderProps}
 */
export function DashboardHeader({ user }: DashboardHeaderProps) {
  const roleSubtitle = getRoleSubtitle(user.role);

  return (
    <div>
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">
        Dashboard Principal
      </h1>
      <p className="font-label-bold text-xs text-on-surface-variant uppercase tracking-wider">
        RESUMEN FINANCIERO CONSOLIDADO | {roleSubtitle}
      </p>
    </div>
  );
}
