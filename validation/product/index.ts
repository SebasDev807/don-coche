import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  brand: z.string().optional(),
  category: z.string().min(2, 'La categoría debe tener al menos 2 caracteres'),
  stock: z.number({ message: 'Debes ingresar un valor numérico' }).min(1, 'El stock debe ser al menos 1'),
  unitCost: z.number({ message: 'Debes ingresar un valor numérico' }).min(1, 'El costo debe ser al menos 1'),
  salePrice: z.number({ message: 'Debes ingresar un valor numérico' }).min(1, 'El precio debe ser al menos 1'),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
