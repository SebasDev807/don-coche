/**
 * @fileoverview Gestión de sesiones server-side con cookies HttpOnly.
 *
 * Implementa sesiones stateless usando JWT firmados con `jose` (HS256).
 * Las cookies son HttpOnly, lo que impide que JavaScript del cliente
 * las lea o modifique, eliminando el riesgo de manipulación desde DevTools.
 *
 * Patrón: Next.js 16 official authentication guide.
 */

import 'server-only';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/**
 * Datos mínimos del usuario que se almacenan en el payload del JWT.
 * No incluir información sensible como contraseñas o datos personales.
 */
export interface SessionPayload {
  /** UUID del usuario en la base de datos. */
  userId: string;
  /** Nombre completo del usuario. */
  name: string;
  /** Rol del usuario (GERENTE, ADMINISTRADOR, TECNICO, SUPERUSUARIO). */
  role: string;
  /** Fecha de expiración de la sesión. */
  expiresAt: Date;
}

// ─── Configuración ─────────────────────────────────────────────────────────────

const SECRET_KEY = process.env.AUTH_SECRET;
if (!SECRET_KEY) {
  throw new Error('AUTH_SECRET no está definido en las variables de entorno.');
}
const ENCODED_KEY = new TextEncoder().encode(SECRET_KEY);

/** Duración de la sesión en milisegundos (7 días). */
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/** Nombre de la cookie de sesión. */
const SESSION_COOKIE_NAME = 'session';

// ─── Cifrado / Descifrado ──────────────────────────────────────────────────────

/**
 * Cifra el payload del usuario generando un JWT firmado con HS256.
 *
 * @param payload - Datos del usuario a serializar en el token.
 * @returns Token JWT como string.
 */
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(ENCODED_KEY);
}

/**
 * Descifra y verifica un JWT de sesión.
 *
 * @param token - Token JWT a verificar.
 * @returns Payload deserializado, o `undefined` si el token es inválido o expirado.
 */
export async function decrypt(
  token: string | undefined
): Promise<SessionPayload | undefined> {
  if (!token) return undefined;

  try {
    const { payload } = await jwtVerify(token, ENCODED_KEY, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    // Token inválido, expirado o malformado — se trata como sesión inexistente.
    return undefined;
  }
}

// ─── Gestión de Cookies ────────────────────────────────────────────────────────

/**
 * Crea una nueva sesión y la almacena en una cookie HttpOnly.
 *
 * Debe llamarse desde un Server Action tras una autenticación exitosa.
 *
 * @param user - Datos del usuario autenticado.
 */
export async function createSession(
  user: Pick<SessionPayload, 'userId' | 'name' | 'role'>
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const token = await encrypt({
    ...user,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Renueva la expiración de la sesión activa (sliding session).
 *
 * Se invoca desde el middleware en cada request para mantener activa
 * la sesión mientras el usuario interactúa con la app.
 */
export async function updateSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = await decrypt(token);

  if (!payload) return;

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const newToken = await encrypt({ ...payload, expiresAt });

  cookieStore.set(SESSION_COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Elimina la cookie de sesión, cerrando la sesión del usuario.
 *
 * Debe llamarse desde un Server Action de logout.
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Obtiene el payload de la sesión activa desde la cookie, sin redirigir.
 *
 * Útil para el middleware donde no se puede usar `redirect()`.
 *
 * @returns Payload de la sesión o `undefined` si no existe.
 */
export async function getSession(): Promise<SessionPayload | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return decrypt(token);
}
