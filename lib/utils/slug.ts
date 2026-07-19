/**
 * @fileoverview Funciones de utilidad para manejar y generar slugs.
 */

/**
 * Genera un slug en formato snake_case a partir de una cadena de texto.
 * 
 * Este helper convierte el texto a minúsculas, reemplaza todos los
 * caracteres que no sean alfanuméricos por guiones bajos (_) y 
 * elimina los guiones bajos sobrantes al inicio o al final.
 * 
 * @param {string} text - El texto original (ej. el nombre del producto).
 * @returns {string} El slug generado en snake_case.
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
