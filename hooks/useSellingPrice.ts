export const useSellingPrice = (basePrice: string | number | undefined, profitPercentage: string | number | undefined) => {
  const cost = typeof basePrice === 'string' ? parseInt(basePrice.replace(/\D/g, ''), 10) || 0 : basePrice || 0;
  const percentage = typeof profitPercentage === 'string' ? parseFloat(profitPercentage) || 0 : profitPercentage || 0;
  
  const sellingPrice = cost + (cost * percentage / 100);
  
  const formattedSellingPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(sellingPrice);

  return { sellingPrice, formattedSellingPrice };
};
