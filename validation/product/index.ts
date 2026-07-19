import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  brand: z.string().optional(),
  category: z.enum(['LAVADERO', 'SERVITECA', 'LUBRICANTES', 'ACCESORIOS'], {
    message: 'Debes seleccionar una categoría válida',
  }),
  stock: z.number().min(0, 'El stock no puede ser negativo'),
  unitCost: z.number().min(0, 'El costo unitario no puede ser negativo'),
  salePrice: z.number().min(0, 'El precio de venta no puede ser negativo'),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
