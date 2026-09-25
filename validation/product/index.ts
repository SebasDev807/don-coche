import { z } from 'zod';
import { parseLocalizedNumber } from '@/lib/utils/parseLocalizedNumber';

export const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  barCode: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  stock: z.coerce.number({ message: 'Debes ingresar un valor numérico' }).min(0, 'El stock no puede ser negativo'),
  unitCost: z.preprocess((val) => {
    if (typeof val === 'string') return parseLocalizedNumber(val);
    return val;
  }, z.number({ message: 'Debes ingresar un valor numérico' }).min(0.01, 'El costo debe ser mayor a 0')),
  salePrice: z.preprocess((val) => {
    if (typeof val === 'string') return parseLocalizedNumber(val);
    return val;
  }, z.number({ message: 'Debes ingresar un valor numérico' }).min(0.01, 'El precio debe ser mayor a 0').optional()),
  profitPercentage: z.preprocess((val) => {
    if (typeof val === 'string' && val !== '') return parseFloat(val.replace(',', '.'));
    if (val === '') return undefined;
    return val;
  }, z.number({ message: 'Debes ingresar un valor numérico' }).min(0, 'El porcentaje no puede ser negativo').optional()),
  iva: z.preprocess((val) => {
    if (typeof val === 'string' && val !== '') return parseFloat(val);
    if (val === '') return undefined;
    return val;
  }, z.number({ message: 'Debes ingresar un valor numérico' }).min(0, 'El IVA no puede ser negativo').max(100, 'El IVA máximo es 100').optional()),
  hasIva: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false || val === undefined) return false;
    return Boolean(val);
  }, z.boolean().optional().default(true)),
  autoRound: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false || val === undefined) return false;
    return Boolean(val);
  }, z.boolean().optional().default(true)),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;

export const createCategorySchema = z.object({
  name: z.string().min(2, 'El nombre de la categoría debe tener al menos 2 caracteres'),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;
