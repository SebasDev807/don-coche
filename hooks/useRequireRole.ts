/**
 * @fileoverview Hook reutilizable de protección de ruta por rol.
 *
 * Permite a cualquier página o layout restringir el acceso a un conjunto
 * de roles permitidos. Si el usuario no está autenticado o no tiene
 * un rol autorizado, se redirige automáticamente a `/auth`.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type User } from '@/store/useAuthStore';

/**
 * Resultado del hook `useRequireRole`.
 *
 * - `isLoading`: `true` mientras Zustand hidrata el estado desde localStorage.
 * - `isAuthorized`: `true` si el usuario tiene un rol permitido.
 * - `user`: Datos del usuario autenticado (solo disponible si `isAuthorized` es `true`).
 */
interface UseRequireRoleResult {
  isLoading: boolean;
  isAuthorized: boolean;
  user: User | null;
}

/**
 * Protege una ruta verificando que el usuario autenticado tenga uno de los
 * roles indicados. Si no cumple, redirige a `/auth`.
 *
 * @param allowedRoles - Arreglo de roles que tienen acceso a esta ruta.
 * @returns Estado de carga, autorización y datos del usuario.
 *
 * @example
 * ```tsx
 * const { isLoading, isAuthorized, user } = useRequireRole(['GERENTE', 'ADMINISTRADOR']);
 * if (isLoading || !isAuthorized) return null;
 * ```
 */
export function useRequireRole(allowedRoles: string[]): UseRequireRoleResult {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user || !allowedRoles.includes(user.role)) {
      router.push('/auth');
    }
  }, [user, hasHydrated, router, allowedRoles]);

  if (!hasHydrated) {
    return { isLoading: true, isAuthorized: false, user: null };
  }

  const isAuthorized = !!user && allowedRoles.includes(user.role);

  return { isLoading: false, isAuthorized, user: isAuthorized ? user : null };
}
