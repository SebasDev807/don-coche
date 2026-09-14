/**
 * Parsea un número formateado con separadores locales.
 *
 * Reglas:
 * - Si hay AMBOS separadores (. y ,): el que aparece MÁS A LA DERECHA es el decimal.
 * - Si hay SOLO uno:
 *   - Si tiene exactamente 3 dígitos después → separador de MILES (ej: "2.500" = 2500)
 *   - Si tiene 1 o 2 dígitos después → separador DECIMAL (ej: "2,50" = 2.5)
 */
export function parseLocalizedNumber(val: string): number {
  if (!val || val.trim() === '') return 0;

  const clean = val.replace(/[^\d.,]/g, '');
  if (!clean) return 0;

  const lastDot = clean.lastIndexOf('.');
  const lastComma = clean.lastIndexOf(',');

  let numericStr: string;

  if (lastDot === -1 && lastComma === -1) {
    // Solo dígitos
    numericStr = clean;
  } else if (lastDot !== -1 && lastComma !== -1) {
    // Ambos presentes: el último es el decimal
    if (lastDot > lastComma) {
      // punto = decimal: "45,000.78"
      numericStr = clean.replace(/,/g, '');
    } else {
      // coma = decimal: "45.000,78"
      numericStr = clean.replace(/\./g, '').replace(',', '.');
    }
  } else if (lastDot !== -1) {
    // Solo punto
    const afterDot = clean.slice(lastDot + 1);
    if (afterDot.length === 3) {
      // "2.500" o "1.500.000" → punto = miles
      numericStr = clean.replace(/\./g, '');
    } else {
      // "2.5" o "2.50" → punto = decimal
      numericStr = clean;
    }
  } else {
    // Solo coma
    const afterComma = clean.slice(lastComma + 1);
    if (afterComma.length === 3) {
      // "2,500" → coma = miles
      numericStr = clean.replace(/,/g, '');
    } else {
      // "2,5" o "2,50" → coma = decimal
      numericStr = clean.replace(',', '.');
    }
  }

  const result = parseFloat(numericStr);
  return isNaN(result) ? 0 : result;
}
