/**
 * @fileoverview Server Action de autenticación.
 *
 * Valida las credenciales del usuario contra la base de datos PostgreSQL
 * usando Prisma para la consulta y bcrypt para la comparación del hash.
 *
 * Retorna un objeto con el resultado de la operación, sin exponer
 * datos sensibles (hash, id interno) al cliente.
 */

'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Resultado exitoso de la autenticación.
 */
interface LoginSuccess {
  success: true;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

/**
 * Resultado fallido de la autenticación.
 */
interface LoginFailure {
  success: false;
  message: string;
}

/** Tipo unión del resultado de login. */
type LoginResult = LoginSuccess | LoginFailure;

/**
 * Autentica a un usuario verificando su cédula y contraseña contra la DB.
 *
 * @param cc - Número de cédula de ciudadanía.
 * @param password - Contraseña en texto plano para comparar con el hash.
 * @returns Resultado de la autenticación con datos del usuario o mensaje de error.
 *
 * @example
 * ```ts
 * const result = await loginAction('1002968695', 'devmode12345!');
 * if (result.success) {
 *   // result.user.name, result.user.role
 * }
 * ```
 */
export async function loginAction(cc: string, password: string): Promise<LoginResult> {
  try {
    // Buscar usuario por cédula
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

    // Usuario no encontrado
    if (!user) {
      return { success: false, message: 'Credenciales incorrectas' };
    }

    // Usuario desactivado
    if (!user.isActive) {
      return { success: false, message: 'Esta cuenta ha sido desactivada' };
    }

    // Comparar contraseña con hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return { success: false, message: 'Credenciales incorrectas' };
    }

    // Autenticación exitosa — no exponer hash al cliente
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('[loginAction] Error de autenticación:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
}
