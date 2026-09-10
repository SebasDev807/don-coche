import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  categoryId: z.string().uuid('Categoría no válida').optional().or(z.literal('')),
  category: z.enum(['LAVADERO', 'SERVITECA']).optional(),
  basePrice: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val.replace(/\D/g, ''), 10) || 0;
    return val;
  }, z.number({ message: 'Debes ingresar un valor numérico' }).min(0, 'El precio no puede ser negativo')),
  profitPercentage: z.coerce.number().min(0, 'La ganancia no puede ser negativa').optional(),
  description: z.string().optional(),
  autoRound: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false || val === undefined) return false;
    return Boolean(val);
  }, z.boolean().optional().default(true)),
});

export type CreateServiceFormValues = z.infer<typeof createServiceSchema>;
