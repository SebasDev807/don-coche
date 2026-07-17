/**
 * @fileoverview Barrel export para las acciones de personal (staff).
 * 
 * Centraliza las exportaciones de los Server Actions relacionados
 * con los empleados para facilitar su importación.
 */

export { getStaffUsers } from './actions/getStaffUsers.actions';
export { deleteStaffUser } from './actions/deleteStaffUser.actions';
export { createStaffUser } from './actions/createStaffUser.actions';
export { updateStaffUser } from './actions/updateStaffUser.actions';
