import { createProductSchema } from './validation/product/index';

try {
  const result = createProductSchema.parse({
    name: 'aa',
    brand: 'aa',
    category: 'aa',
    stock: 1,
    unitCost: '1.000.000.000',
    salePrice: '10.000.000'
  });
  console.log('Success:', result);
} catch (e: any) {
  console.log('Error:', e.errors);
}
