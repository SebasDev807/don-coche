import { z } from 'zod';

export const editServiceSchema = z.object({
  slug: z.string().optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  category: z.enum(['LAVADERO', 'SERVITECA']).optional(),
  basePrice: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val.replace(/\D/g, ''), 10) || 0;
    return val;
  }, z.number({ message: 'Debes ingresar un valor numérico' }).min(0, 'El precio no puede ser negativo')),
  profitPercentage: z.coerce.number().min(0, 'La ganancia no puede ser negativa').optional(),
  description: z.string().optional(),
});

export type EditServiceFormValues = z.infer<typeof editServiceSchema>;
