/**
 * @fileoverview Barrel export para las acciones de inventario.
 * 
 * Centraliza las exportaciones de los Server Actions relacionados
 * con el inventario para facilitar su importación.
 */

export { createProduct, getCategories, createCategory } from './core.actions';
export { updateProduct } from './updateProduct.actions';
export { deleteProduct } from './deleteProduct.actions';
