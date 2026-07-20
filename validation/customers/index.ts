import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Correo electrónico no válido').optional().or(z.literal('')),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const vehicleSchema = z.object({
  plate: z.string().min(5, 'Placa inválida').max(10, 'Placa muy larga').toUpperCase(),
  brand: z.string().optional().or(z.literal('')),
  model: z.string().optional().or(z.literal('')),
  color: z.string().optional().or(z.literal('')),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;
