import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  brand: z.string().min(1, 'La marca es obligatoria'),
  category: z.string().min(2, 'La categoría debe tener al menos 2 caracteres'),
  stock: z.coerce.number({ message: 'Debes ingresar un valor numérico' }).min(1, 'El stock debe ser al menos 1'),
  unitCost: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val.replace(/\D/g, ''), 10) || 0;
    return val;
  }, z.number({ message: 'Debes ingresar un valor numérico' }).min(1, 'El costo debe ser al menos 1')),
  salePrice: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val.replace(/\D/g, ''), 10) || 0;
    return val;
  }, z.number({ message: 'Debes ingresar un valor numérico' }).min(1, 'El precio debe ser al menos 1')),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;

export const createCategorySchema = z.object({
  name: z.string().min(2, 'El nombre de la categoría debe tener al menos 2 caracteres'),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;
