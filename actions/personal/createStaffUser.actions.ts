'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { createUserSchema } from '@/validation';
import { verifyRole } from '@/lib/dal';

export async function createStaffUser(formData: FormData) {
  // Verificar sesión y rol en el servidor antes de cualquier operación
  await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

  try {
    const data = Object.fromEntries(formData.entries());
    
    // Parse using Zod
    const parsedData = createUserSchema.safeParse(data);
    
    if (!parsedData.success) {
      return { success: false, message: 'Revisa los campos del formulario.' };
    }

    const { cc, name, email, celular, role, department, password } = parsedData.data;

    // Check if user already exists
    const existingUserByCC = await prisma.user.findUnique({
      where: { cc },
    });

    if (existingUserByCC) {
      return { success: false, message: 'Ya existe un usuario con esa cédula (CC).' };
    }

    if (email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUserByEmail) {
        return { success: false, message: 'Ya existe un usuario con este correo electrónico.' };
      }
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    await prisma.user.create({
      data: {
        cc,
        name,
        email: email || null,
        celular: celular || null,
        role,
        department: role === 'TECNICO' ? (department === '' ? null : (department as any)) : null,
        passwordHash,
      },
    });

    revalidatePath('/personal');

    return { success: true, message: 'Empleado creado correctamente.' };
  } catch (error) {
    console.error('Error creating staff user:', error);
    return { success: false, message: 'Ocurrió un error inesperado al intentar crear el usuario.' };
  }
}
