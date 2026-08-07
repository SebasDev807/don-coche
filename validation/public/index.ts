import { z } from 'zod';

export const publicAppointmentSchema = z.object({
  customerCc: z.string().min(5, 'Cédula muy corta').max(20, 'Cédula muy larga'),
  customerName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  customerPhone: z.string().min(7, 'Teléfono inválido'),
  customerEmail: z.string().email('Correo inválido').optional().or(z.literal('')),
  plate: z.string().min(6, 'Placa inválida').max(10, 'Placa inválida'),
  carBrand: z.string().min(2, 'Marca requerida'),
  carModel: z.string().min(2, 'Modelo requerido'),
  carColor: z.string().optional().or(z.literal('')),
  scheduledAtDate: z.string().min(1, 'Seleccione una fecha'),
  scheduledAtTime: z.string().min(1, 'Seleccione una hora'),
  description: z.string().min(1, 'Seleccione un motivo (ej: Lavado)'),
});

export type PublicAppointmentSchemaType = z.infer<typeof publicAppointmentSchema>;
