import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  categoryId: z.string().uuid('Categoría no válida').optional().or(z.literal('')),
  category: z.enum(['LAVADERO', 'SERVITECA']).optional(),
  basePrice: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val.replace(/\D/g, ''), 10) || 0;
    return val;
  }, z.number({ message: 'Debes ingresar un valor numérico' }).min(0, 'El precio no puede ser negativo')),
  description: z.string().optional(),
  products: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val || [];
  }, z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().min(1),
    isRequired: z.boolean().default(true)
  }))).optional(),
});

export type CreateServiceFormValues = z.infer<typeof createServiceSchema>;
