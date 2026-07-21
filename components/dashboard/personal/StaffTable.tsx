'use client';

import { User } from '@prisma/client';
import { useState, useTransition } from 'react';
import { deleteStaffUser } from '@/actions/personal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

/**
 * Propiedades del componente StaffTable.
 */
interface StaffTableProps {
  /** Array de usuarios del personal para poblar la tabla */
  users: User[];
}

/**
 * Tabla interactiva que muestra el listado detallado del personal.
 * 
 * Expone la información principal (nombre, documento, contacto, rol y estado)
 * y provee botones de acción rápida para actualizar datos, cambiar la contraseña
 * y realizar un borrado lógico (soft delete) del usuario.
 * 
 * @param {StaffTableProps} props - Propiedades del componente con el array de usuarios.
 * @returns {JSX.Element} El componente de React para visualizar la tabla.
 */
export function StaffTable({ users }: StaffTableProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (userId: string, userName: string) => {
    MySwal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas eliminar a ${userName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgba(221, 213, 51, 1)',
      cancelButtonColor: 'rgba(2, 14, 30, 1)',
      customClass: {
        confirmButton: '!text-black',
        cancelButton: '!text-white'
      },
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const res = await deleteStaffUser(userId);
          if (res.success) {
            MySwal.fire('¡Eliminado!', res.message, 'success');
            router.refresh();
          } else {
            MySwal.fire('Error', res.message, 'error');
          }
        });
      }
    });
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-highest overflow-hidden">
      <div className="overflow-x-auto min-h-[460px]">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-container border-b border-outline-variant">
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">Nombre Completo</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">Documento (CC)</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">Contacto</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">Rol</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">Estado</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant font-body-md text-on-surface">
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-on-surface shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium truncate max-w-[200px]" title={user.name}>{user.name}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-secondary">{user.cc}</td>
                <td className="py-4 px-6 text-secondary">
                  <div className="flex flex-col text-sm">
                    {user.email ? <span className="truncate max-w-[150px]" title={user.email}>{user.email}</span> : <span className="text-surface-variant">-</span>}
                    {user.celular ? <span>{user.celular}</span> : <span className="text-surface-variant">-</span>}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col items-start gap-1">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleStyles(user.role)}`}>
                      {formatRole(user.role)}
                    </span>
                    {(user as any).department && (
                      <span className="text-[11px] text-secondary font-medium tracking-wide bg-surface-container px-2 py-0.5 rounded">
                        {((user as any).department as string).toUpperCase()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  {user.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/personal/editar/${user.cc}`}
                      title="Editar"
                      className={`cursor-pointer text-secondary hover:text-primary p-2 rounded-full hover:bg-surface-container transition-colors ${!user.isActive || isPending ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </Link>
                    <button title="Actualizar Contraseña" className="cursor-pointer text-secondary hover:text-primary p-2 rounded-full hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </button>
                    <button
                      title="Eliminar (Soft Delete)"
                      className={`cursor-pointer text-secondary hover:text-error p-2 rounded-full hover:bg-surface-container transition-colors ${!user.isActive || isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => handleDelete(user.id, user.name)}
                      disabled={!user.isActive || isPending}
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-secondary">
                  No hay empleados registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Footer */}
      {users.length > 0 && (
        <div className="bg-surface border-t border-outline-variant p-4 flex items-center justify-between">
          <p className="text-sm text-secondary">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, users.length)} de {users.length} empleados
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="cursor-pointer p-2 border border-outline-variant rounded hover:bg-surface-container text-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="cursor-pointer p-2 border border-outline-variant rounded hover:bg-surface-container text-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Obtiene las clases CSS correspondientes al estilo del "badge" de cada rol.
 * 
 * @param {string} role - El rol del empleado (e.g., GERENTE, TECNICO).
 * @returns {string} Las clases de Tailwind para el diseño del rol.
 */
function getRoleStyles(role: string): string {
  switch (role) {
    case 'SUPERUSUARIO':
      return 'bg-red-100 text-red-800';
    case 'GERENTE':
      return 'bg-purple-100 text-purple-800';
    case 'ADMINISTRADOR':
      return 'bg-blue-100 text-blue-800';
    case 'TECNICO':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Formatea el texto del rol para que sea Capitalizado (e.g., GERENTE -> Gerente).
 * 
 * @param {string} role - El rol del usuario en mayúsculas sostenidas.
 * @returns {string} El rol en formato de palabra capitalizada.
 */
function formatRole(role: string): string {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}
