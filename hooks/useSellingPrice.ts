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
  
  const marginFactor = 1 - (percentage / 100);
  // Prevenir división por cero si el margen es 100%
  const safeMarginFactor = marginFactor <= 0 ? 0.01 : marginFactor;
  
  let sellingPrice = (cost / safeMarginFactor) * (1 + iva / 100);
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
