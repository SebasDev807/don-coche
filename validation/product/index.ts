import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  barCode: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(2, 'La categoría debe tener al menos 2 caracteres'),
  stock: z.coerce.number({ message: 'Debes ingresar un valor numérico' }).min(0, 'El stock no puede ser negativo'),
  unitCost: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val.replace(/\D/g, ''), 10) || 0;
    return val;
  }, z.number({ message: 'Debes ingresar un valor numérico' }).min(1, 'El costo debe ser al menos 1')),
  salePrice: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val.replace(/\D/g, ''), 10) || 0;
    return val;
  }, z.number({ message: 'Debes ingresar un valor numérico' }).min(1, 'El precio debe ser al menos 1').optional()),
  profitPercentage: z.preprocess((val) => {
    if (typeof val === 'string' && val !== '') return parseFloat(val);
    if (val === '') return undefined;
    return val;
  }, z.number({ message: 'Debes ingresar un valor numérico' }).min(0, 'El porcentaje no puede ser negativo').max(100, 'El porcentaje máximo es 100').optional()),
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
