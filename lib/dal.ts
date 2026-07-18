/**
 * @fileoverview Data Access Layer (DAL) — Capa de acceso a datos con autorización.
 *
 * Centraliza la verificación de sesión para usarse en Server Components,
 * Server Actions y Route Handlers. Garantiza que la validación de autenticación
 * ocurra siempre en el servidor, cerca del origen de los datos.
 *
 * Usa `React.cache` para memoizar la verificación durante un mismo render pass,
 * evitando llamadas redundantes al desencriptar la cookie múltiples veces.
 */

import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getSession, type SessionPayload } from '@/lib/session';

// ─── Tipos Públicos ────────────────────────────────────────────────────────────

/**
 * Datos de sesión verificados disponibles para uso interno en el servidor.
 */
export interface VerifiedSession {
  userId: string;
  name: string;
  role: string;
}

// ─── Funciones del DAL ─────────────────────────────────────────────────────────

/**
 * Verifica que exista una sesión válida. Si no hay sesión, redirige a `/auth`.
 *
 * Memoizada con `React.cache` para evitar múltiples desencriptados de cookie
 * en un mismo ciclo de render del servidor.
 *
 * @returns Datos del usuario autenticado.
 *
 * @example
 * ```ts
 * // En un Server Component o Server Action:
 * const session = await verifySession();
 * console.log(session.role); // 'GERENTE'
 * ```
 */
export const verifySession = cache(async (): Promise<VerifiedSession> => {
  const payload: SessionPayload | undefined = await getSession();

  if (!payload?.userId) {
    redirect('/auth');
  }

  return {
    userId: payload.userId,
    name: payload.name,
    role: payload.role,
  };
});

/**
 * Verifica la sesión y además valida que el rol del usuario esté entre los permitidos.
 * Si el rol no está autorizado, redirige a `/auth`.
 *
 * @param allowedRoles - Lista de roles con acceso permitido.
 * @returns Datos del usuario autenticado si tiene el rol requerido.
 *
 * @example
 * ```ts
 * const session = await verifyRole(['GERENTE', 'ADMINISTRADOR']);
 * ```
 */
export async function verifyRole(allowedRoles: string[]): Promise<VerifiedSession> {
  const session = await verifySession();

  if (!allowedRoles.includes(session.role)) {
    redirect('/auth');
  }

  return session;
}
