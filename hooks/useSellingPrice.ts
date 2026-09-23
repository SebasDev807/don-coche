import { parseLocalizedNumber } from '@/lib/utils/parseLocalizedNumber';

export const useSellingPrice = (basePrice: string | number | undefined, profitPercentage: string | number | undefined, ivaPercentage: string | number | undefined = 19, hasIva: boolean = true, autoRound: boolean = true) => {
  let cost = 0;
  if (typeof basePrice === 'string') {
    cost = parseLocalizedNumber(basePrice);
  } else {
    cost = basePrice || 0;
  }
  const percentage = typeof profitPercentage === 'string' ? parseFloat(profitPercentage) || 0 : profitPercentage || 0;
  const iva = hasIva ? (typeof ivaPercentage === 'string' ? parseFloat(ivaPercentage) || 0 : ivaPercentage || 0) : 0;
  
  // Aplicar IVA al costo base para obtener el costo con IVA incluido
  const costWithIva = hasIva ? cost * (1 + iva / 100) : cost;
  
  // Cálculo del precio de venta usando Markup (Costo con IVA * (1 + Margen))
  let sellingPrice = costWithIva * (1 + (percentage / 100));
  if (autoRound) {
    sellingPrice = Math.round(sellingPrice / 50) * 50;
  }
  
  const numStr = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(sellingPrice);
  const formattedSellingPrice = `$ ${numStr}`;

  return { sellingPrice, formattedSellingPrice };
};
