/**
 * @fileoverview Funciones de utilidad para generar códigos de barras.
 */

/**
 * Genera un código de barras EAN-13 válido (12 dígitos + 1 dígito de control).
 * Los prefijos del 200 al 299 están reservados para uso interno (in-store).
 *
 * @param {string} prefix - Prefijo inicial (por defecto '200' para uso interno).
 * @returns {string} El código EAN-13 autogenerado.
 */
export function generateEAN13(prefix: string = '200'): string {
  let base = prefix;
  
  // Genera dígitos aleatorios hasta completar 12 dígitos
  while (base.length < 12) {
    base += Math.floor(Math.random() * 10).toString();
  }

  // Calcular el dígito de control (checksum)
  // Se multiplican los dígitos en posiciones impares por 1 y los pares por 3
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i], 10);
    // En el string, los índices pares (0, 2, 4...) corresponden a las posiciones impares (1, 3, 5...)
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return base + checkDigit.toString();
}
