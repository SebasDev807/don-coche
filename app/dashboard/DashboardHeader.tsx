'use client';

import { useAuthStore } from '@/store/useAuthStore';

/**
 * Mapea el rol del usuario a una etiqueta visible en el header.
 *
 * @param role - Rol del usuario.
 * @returns Etiqueta en mayúsculas para el subtítulo.
 */
function getRoleSubtitle(role: string): string {
  const labels: Record<string, string> = {
    SUPERUSUARIO: 'SUPERUSUARIO',
    GERENTE: 'SUPERUSUARIO',
    ADMINISTRADOR: 'ADMINISTRADOR',
  };
  return labels[role] ?? role;
}

export function DashboardHeader() {
  const user = useAuthStore((state) => state.user);
  const roleSubtitle = getRoleSubtitle(user?.role ?? '');

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
