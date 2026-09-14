'use server';
/**
 * @fileoverview Server Actions de autenticación.
 *
 * - `loginAction`: Valida credenciales contra la DB y crea la sesión HttpOnly.
 * - `logoutAction`: Elimina la cookie de sesión y redirige a `/auth`.
 *
 * Ambas acciones corren exclusivamente en el servidor (`'use server'`).
 */


import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession, deleteSession, getSession, updateSession } from '@/lib/session';
import { redirect } from 'next/navigation';

// ─── Tipos ─────────────────────────────────────────────────────────────────────

/**
 * Resultado exitoso del login: incluye los datos básicos del usuario
 * para que el cliente pueda mostrar el mensaje de bienvenida.
 */
export interface LoginSuccess {
  success: true;
  user: {
    name: string;
    role: string;
  };
}

/** Resultado fallido del login con mensaje de error para mostrar al usuario. */
export interface LoginFailure {
  success: false;
  message: string;
}

/** Tipo unión del resultado de `loginAction`. */
export type LoginResult = LoginSuccess | LoginFailure;

// ─── Login ─────────────────────────────────────────────────────────────────────

/**
 * Autentica un usuario verificando su cédula y contraseña contra la DB.
 *
 * En caso de éxito, crea una sesión HttpOnly firmada con JWT y retorna
 * los datos básicos del usuario para mostrar el feedback visual en el cliente.
 *
 * @param cc - Número de cédula de ciudadanía.
 * @param password - Contraseña en texto plano.
 * @returns Resultado de la autenticación.
 */
export async function loginAction(cc: string, password: string): Promise<LoginResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { cc },
      select: {
        id: true,
        name: true,
        role: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user) {
      return { success: false, message: 'Credenciales incorrectas' };
    }

    if (!user.isActive) {
      https://fedoraproject.org/start
      return { success: false, message: 'Esta cuenta ha sido desactivada' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: 'Credenciales incorrectas' };
    }

    // Crear sesión segura en cookie HttpOnly
    await createSession({
      userId: user.id,
      name: user.name,
      role: user.role,
    });


    // Retornar datos mínimos para el feedback de bienvenida en el cliente
    return {
      success: true,
      user: {
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('[loginAction] Error de autenticación:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
}

// ─── Logout ────────────────────────────────────────────────────────────────────

/**
 * Cierra la sesión del usuario eliminando la cookie de sesión
 * y redirigiendo a la pantalla de login.
 *
 * Debe llamarse desde un Server Component o Server Action.
 */
export async function logoutAction(): Promise<never> {


  await deleteSession();
  redirect('/auth');
}

// ─── Control de Expiración de Sesión ───────────────────────────────────────────

/**
 * Retorna la fecha de expiración actual del token JWT.
 */
export async function getSessionExpiryAction(): Promise<Date | undefined> {
  try {
    const session = await getSession();
    if (session?.expiresAt) {
      return new Date(session.expiresAt);
    }
  } catch (error) {
    console.error('[getSessionExpiryAction] Error:', error);
  }
  return undefined;
}

/**
 * Extiende manualmente la sesión actual 8 horas más.
 */
export async function extendSessionAction(): Promise<boolean> {
  try {
    const session = await getSession();
    if (session) {
      await updateSession();
      return true;
    }
  } catch (error) {
    console.error('[extendSessionAction] Error:', error);
  }
  return false;
}

/**
 * Cambia la sesión activa a otro usuario autenticado previamente en este dispositivo.
 * Solo funciona si el targetUserId está en la lista de `users` del payload actual.
 */
export async function switchSessionAction(targetUserId: string): Promise<boolean> {
  try {
    const payload = await getSession();
    if (!payload || !payload.users) return false;

    const targetUser = payload.users.find(u => u.userId === targetUserId);
    if (!targetUser) return false;

    // Crear un nuevo token con targetUser como activo, manteniendo el array de users
    const { encrypt } = await import('@/lib/session');
    const { cookies } = await import('next/headers');
    
    // Asumimos 8 horas igual que createSession
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const token = await encrypt({
      userId: targetUser.userId,
      name: targetUser.name,
      role: targetUser.role,
      users: payload.users,
      expiresAt,
    });
    
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
      sameSite: 'lax',
      path: '/',
    });

    return true;
  } catch (error) {
    console.error('[switchSessionAction] Error:', error);
    return false;
  }
}
