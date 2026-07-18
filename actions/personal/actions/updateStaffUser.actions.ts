'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { updateUserSchema } from '@/validation';
import { verifyRole } from '@/lib/dal';

export async function updateStaffUser(id: string, formData: FormData) {
  // Verificar sesión y rol en el servidor antes de cualquier operación
  await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

  try {
    const data = Object.fromEntries(formData.entries());
    
    // Parse using Zod
    const parsedData = updateUserSchema.safeParse(data);
    
    if (!parsedData.success) {
      return { success: false, message: 'Revisa los campos del formulario.' };
    }

    const { cc, name, email, celular, role } = parsedData.data;

    // Check if another user has the same CC
    const existingUserByCC = await prisma.user.findUnique({
      where: { cc },
    });

    if (existingUserByCC && existingUserByCC.id !== id) {
      return { success: false, message: 'Ya existe OTRO usuario con esa cédula (CC).' };
    }

    // Check if another user has the same email
    if (email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUserByEmail && existingUserByEmail.id !== id) {
        return { success: false, message: 'Ya existe OTRO usuario con este correo electrónico.' };
      }
    }

    // Update user
    await prisma.user.update({
      where: { id },
      data: {
        cc,
        name,
        email: email || null,
        celular: celular || null,
        role,
      },
    });

    revalidatePath('/dashboard/personal');

    return { success: true, message: 'Empleado actualizado correctamente.' };
  } catch (error) {
    console.error('Error updating staff user:', error);
    return { success: false, message: 'Ocurrió un error inesperado al intentar actualizar el usuario.' };
  }
}
