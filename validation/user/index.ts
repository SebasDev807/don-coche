import { z } from 'zod';

export const createUserSchema = z.object({
  cc: z.string().min(5, 'La cédula debe tener al menos 5 caracteres').max(20, 'La cédula es muy larga'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Debe ser un correo electrónico válido').optional().or(z.literal('')),
  celular: z.string().optional().or(z.literal('')),
  role: z.enum(['GERENTE', 'ADMINISTRADOR', 'TECNICO'], {
    message: 'Debes seleccionar un rol válido',
  }),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-zA-Z]/, 'Debe contener al menos una letra')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.omit({ password: true });

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
