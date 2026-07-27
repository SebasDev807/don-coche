import { z } from 'zod';

export const editServiceSchema = z.object({
  slug: z.string().optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  category: z.enum(['LAVADERO', 'SERVITECA']).optional(),
  basePrice: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val.replace(/\\D/g, ''), 10) || 0;
    return val;
  }, z.number({ message: 'Debes ingresar un valor numérico' }).min(0, 'El precio no puede ser negativo')),
  profitPercentage: z.preprocess((val) => {
    if (typeof val === 'string' && val !== '') return parseFloat(val);
    if (val === '') return undefined;
    return val;
  }, z.number({ message: 'Debe ser numérico' }).min(0, 'El porcentaje no puede ser negativo').max(100, 'El porcentaje máximo es 100').optional()),
  description: z.string().optional(),
});

export type EditServiceFormValues = z.infer<typeof editServiceSchema>;
