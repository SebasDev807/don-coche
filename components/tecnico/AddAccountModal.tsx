'use client';

import React, { useState } from 'react';
import { loginAction } from '@/actions/auth.actions';
import Swal from 'sweetalert2';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAccountModal({ isOpen, onClose }: AddAccountModalProps) {
  const [cc, setCc] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cc || !password) {
      setError('Por favor, ingresa tu cédula y contraseña.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await loginAction(cc, password);

    setIsLoading(false);

    if (result.success) {
      onClose();
      Swal.fire({
        toast: true,
        position: 'top-end',
        title: `Bienvenido, ${result.user.name}`,
        icon: 'success',
        showConfirmButton: false,
        timer: 2000
      });
      // Recargar la página para que Next.js actualice la sesión y la UI
      window.location.reload();
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-sm rounded-3xl shadow-xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-surface-variant">
          <h2 className="text-xl font-bold text-on-surface leading-tight">Agregar Cuenta</h2>
          <button 
            type="button" 
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant p-2 rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <p className="text-sm text-on-surface-variant mb-2">
            Inicia sesión con tu cédula y contraseña para agregarte a los técnicos disponibles.
          </p>

          {error && (
            <div className="p-3 bg-error-container text-on-error-container text-sm rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Cédula</label>
            <input
              type="number"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low border border-surface-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
              placeholder="Ej: 1020304050"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low border border-surface-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
              placeholder="Contraseña"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-bold py-3 px-4 rounded-xl transition-colors mt-2 ${
              isLoading ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed' : 'bg-primary text-on-primary hover:bg-primary-fixed'
            }`}
          >
            {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
