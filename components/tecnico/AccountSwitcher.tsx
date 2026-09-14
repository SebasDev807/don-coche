'use client';

import React, { useState, useRef, useEffect } from 'react';
import { switchSessionAction } from '@/actions/auth.actions';
import Swal from 'sweetalert2';
import { AddAccountModal } from './AddAccountModal';

interface UserInfo {
  userId: string;
  name: string;
  role: string;
}

interface AccountSwitcherProps {
  activeUserId: string;
  availableUsers: UserInfo[];
  logoutAction: () => Promise<never>;
}

export function AccountSwitcher({ activeUserId, availableUsers, logoutAction }: AccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cierra el menú al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeUser = availableUsers.find(u => u.userId === activeUserId) || { name: 'Usuario', userId: '', role: '' };
  const otherUsers = availableUsers.filter(u => u.userId !== activeUserId);

  const handleSwitch = async (targetUserId: string) => {
    setIsOpen(false);
    Swal.fire({
      title: 'Cambiando de cuenta...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const success = await switchSessionAction(targetUserId);
    if (success) {
      // Forzamos la recarga para que el Server Component pida los datos de nuevo con la nueva sesión
      window.location.reload();
    } else {
      Swal.fire('Error', 'No se pudo cambiar de cuenta', 'error');
    }
  };

  const handleAddAccount = () => {
    setIsOpen(false);
    setIsAddAccountOpen(true);
  };

  // Obtener iniciales para el avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón Principal (Avatar) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-surface-variant p-1 pr-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
          {getInitials(activeUser.name)}
        </div>
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-bold text-on-surface truncate max-w-[120px] lg:max-w-[150px]">
            {activeUser.name}
          </span>
          <span className="text-[10px] text-on-surface-variant leading-none hidden lg:block uppercase">
            Cuenta Actual
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
          expand_more
        </span>
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest border border-surface-variant rounded-xl shadow-lg z-50 overflow-hidden fade-in">
          
          <div className="px-4 py-3 border-b border-surface-variant bg-surface-container-low">
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-2">Cuentas Activas</p>
            
            {/* Usuario Actual */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {getInitials(activeUser.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{activeUser.name}</p>
                  <p className="text-[10px] text-primary">Sesión iniciada</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
            </div>
            
            <form action={logoutAction}>
              <button 
                type="submit" 
                className="text-xs text-error hover:underline text-left w-full pl-10"
              >
                Cerrar sesión de {activeUser.name.split(' ')[0]}
              </button>
            </form>
          </div>

          {/* Otros Usuarios */}
          {otherUsers.length > 0 && (
            <div className="py-2 border-b border-surface-variant">
              {otherUsers.map(user => (
                <button
                  key={user.userId}
                  onClick={() => handleSwitch(user.userId)}
                  className="w-full text-left px-4 py-2 hover:bg-surface-variant flex items-center gap-2 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary/20">
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{user.name}</p>
                    <p className="text-[10px] text-on-surface-variant">Toca para cambiar</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Agregar Cuenta */}
          <div className="p-2">
            <button
              onClick={handleAddAccount}
              className="w-full text-left px-3 py-2 hover:bg-surface-variant rounded-lg flex items-center gap-2 text-sm font-bold text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Agregar cuenta
            </button>
          </div>

        </div>
      )}

      <AddAccountModal 
        isOpen={isAddAccountOpen} 
        onClose={() => setIsAddAccountOpen(false)} 
      />
    </div>
  );
}
