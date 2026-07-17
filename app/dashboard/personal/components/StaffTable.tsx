'use client';

import { User } from '@prisma/client';
import Image from 'next/image';

interface StaffTableProps {
  users: User[];
}

export function StaffTable({ users }: StaffTableProps) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-highest overflow-hidden">
      <div className="overflow-x-auto">
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
            {users.map((user) => (
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
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleStyles(user.role)}`}>
                    {formatRole(user.role)}
                  </span>
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
                    <button title="Actualizar Datos" className="text-secondary hover:text-primary p-2 rounded-full hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button title="Actualizar Contraseña" className="text-secondary hover:text-primary p-2 rounded-full hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-[20px]">password</span>
                    </button>
                    <button title="Eliminar (Soft Delete)" className="text-secondary hover:text-error p-2 rounded-full hover:bg-surface-container transition-colors">
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
          <p className="text-sm text-secondary">Mostrando {users.length} empleados</p>
          <div className="flex gap-2">
            <button className="p-2 border border-outline-variant rounded hover:bg-surface-container text-secondary transition-colors" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="p-2 border border-outline-variant rounded hover:bg-surface-container text-secondary transition-colors" disabled>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getRoleStyles(role: string) {
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

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}
