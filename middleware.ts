/**
 * @fileoverview Middleware de protección de rutas a nivel de servidor.
 *
 * Se ejecuta en cada request ANTES de que llegue al page/layout correspondiente.
 * Protege las rutas privadas verificando la cookie de sesión (optimistic check).
 *
 * Lógica:
 * - Rutas protegidas sin sesión → redirige a `/auth`
 * - Ruta `/auth` con sesión activa → redirige a la ruta según rol (evita re-login)
 * - Renueva el TTL de la sesión en cada request (sliding session)
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { decrypt, updateSession } from '@/lib/session';

// ─── Configuración de Rutas ────────────────────────────────────────────────────

/** Prefijos de rutas que requieren autenticación. */
const PROTECTED_PREFIXES = ['/dashboard', '/tecnico'];

/** Rutas públicas que no requieren autenticación. */
const PUBLIC_ROUTES = ['/auth', '/'];

/** Roles que acceden al dashboard de gestión. */
const DASHBOARD_ROLES = ['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR'];

// ─── Middleware ────────────────────────────────────────────────────────────────

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Determinar si la ruta actual está protegida
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // Leer y verificar la sesión desde la cookie (sin usar cookies() de next/headers
  // ya que en middleware se usa req.cookies directamente)
  const token = req.cookies.get('session')?.value;
  const session = await decrypt(token);

  // ── Redirigir si ruta protegida y sin sesión válida ──────────────────────────
  if (isProtected && !session?.userId) {
    return NextResponse.redirect(new URL('/auth', req.url));
  }

  // ── Redirigir si ya autenticado y trata de acceder a /auth ──────────────────
  if (isPublic && pathname === '/auth' && session?.userId) {
    const destination = DASHBOARD_ROLES.includes(session.role)
      ? '/dashboard'
      : '/tecnico';
    return NextResponse.redirect(new URL(destination, req.url));
  }

  // ── Renovar sesión (sliding expiration) ─────────────────────────────────────
  // Solo si hay sesión activa, renovamos para extender el TTL.
  if (session?.userId) {
    try {
      await updateSession();
    } catch {
      // Si falla la renovación no bloqueamos el request
    }
  }

  return NextResponse.next();
}

// ─── Configuración del Matcher ────────────────────────────────────────────────

export const config = {
  /**
   * Excluir archivos estáticos, imágenes de Next.js y la API route de health.
   * El middleware corre en todas las demás rutas.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api).*)'],
};
