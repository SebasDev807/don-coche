'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import bcrypt from 'bcryptjs';

/**
 * Server Action para modificar la contraseña de un usuario del personal.
 * Solo administradores, gerentes o superusuarios pueden realizar esta acción.
 *
 * @param userId - ID del usuario a modificar.
 * @param newPassword - La nueva contraseña en texto plano.
 * @returns Object con success boolean y un mensaje de éxito/error.
 */
export async function changeStaffPassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Validar la sesión
    const session = await verifySession();
    if (!session?.userId) {
      return { success: false, message: 'No estás autenticado.' };
    }

    // 2. Validar que el rol del usuario ejecutor tenga permisos
    const userRole = session.role;
    if (userRole !== 'ADMINISTRADOR' && userRole !== 'GERENTE' && userRole !== 'SUPERUSUARIO') {
      return { success: false, message: 'No tienes permisos para modificar contraseñas.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    // 3. Hashear la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 4. Actualizar en base de datos
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: passwordHash },
    });

    return { success: true, message: 'Contraseña actualizada correctamente.' };
  } catch (error: any) {
    console.error('Error en changeStaffPassword:', error);
    return { success: false, message: error.message || 'Error interno al actualizar la contraseña.' };
  }
}
