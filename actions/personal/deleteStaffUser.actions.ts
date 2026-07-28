'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { verifyRole } from '@/lib/dal';

/**
 * Realiza un soft-delete de un usuario, marcándolo como inactivo.
 * 
 * @param {string} userId - El ID del usuario a eliminar (marcar como inactivo).
 * @returns {Promise<{ success: boolean; message: string }>} Un objeto indicando el resultado de la operación.
 */
export async function deleteStaffUser(userId: string): Promise<{ success: boolean; message: string }> {
  // Verificar sesión y rol en el servidor antes de cualquier operación
  const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

  if (session.userId === userId) {
    return { success: false, message: 'No puedes eliminar tu propia cuenta.' };
  }

  try {
    const userToDelete = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToDelete) {
      return { success: false, message: 'Usuario no encontrado.' };
    }
    
    if (userToDelete.role === 'GERENTE') {
      return { success: false, message: 'No tienes permisos para eliminar a un Gerente.' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Revalidar la página del directorio de personal para reflejar el cambio
    revalidatePath('/personal');

    return { success: true, message: 'Usuario eliminado correctamente.' };
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return { success: false, message: 'Ocurrió un error al intentar eliminar el usuario.' };
  }
}
