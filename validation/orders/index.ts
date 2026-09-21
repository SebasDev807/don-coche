import { z } from 'zod';

export const createOrderSchema = z.object({
  plate: z
    .string()
    .min(5, { message: 'La placa debe tener al menos 5 caracteres' })
    .transform((val) => val.toUpperCase().trim()),
  customerName: z.string().optional(),
  customerCc: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
  carBrand: z.string().optional(),
  carModel: z.string().optional(),
  carColor: z.string().optional(),
  services: z.array(z.string()).min(1, { message: 'Debe seleccionar al menos un servicio' }),
  // Productos opcionales que el técnico puede enviar a caja para incluir en la factura
  products: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
  })).optional(),
  nextMaintenanceDate: z.string().optional(),
  nextMaintenanceReason: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

