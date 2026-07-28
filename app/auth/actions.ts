/**
 * @fileoverview Server Actions de autenticación.
 *
 * - `loginAction`: Valida credenciales contra la DB y crea la sesión HttpOnly.
 * - `logoutAction`: Elimina la cookie de sesión y redirige a `/auth`.
 *
 * Ambas acciones corren exclusivamente en el servidor (`'use server'`).
 */

'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession, deleteSession, getSession } from '@/lib/session';
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

    // Registrar asistencia para roles que no sean gerencia/superusuario
    if (user.role !== 'GERENTE' && user.role !== 'SUPERUSUARIO') {
      // Lazy close: Si por alguna razón el usuario no cerró sesión antes,
      // cerramos cualquier registro pendiente con la hora actual.
      await prisma.attendanceRecord.updateMany({
        where: { userId: user.id, clockOut: null },
        data: { clockOut: new Date() },
      });

      // Crear nuevo registro de entrada
      await prisma.attendanceRecord.create({
        data: { userId: user.id },
      });
    }

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
  try {
    const session = await getSession();
    if (session && session.role !== 'GERENTE' && session.role !== 'SUPERUSUARIO') {
      // Marcar la hora de salida
      await prisma.attendanceRecord.updateMany({
        where: { userId: session.userId, clockOut: null },
        data: { clockOut: new Date() },
      });
    }
  } catch (error) {
    console.error('[logoutAction] Error registrando salida:', error);
  }

  await deleteSession();
  redirect('/auth');
}
