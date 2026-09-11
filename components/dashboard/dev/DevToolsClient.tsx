'use client';

import { useState } from 'react';
import { wipeDevData, verifyDevPassword } from '@/actions/dev/dev.actions';

export function DevToolsClient() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Debes ingresar tu contraseña para desbloquear las opciones.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await verifyDevPassword(password);
      if (res.success) {
        setIsUnlocked(true);
        setErrorMsg('');
      } else {
        setErrorMsg(res.message);
        setPassword('');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Error de red al intentar verificar credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWipe = async () => {
    if (!confirm('¿ESTÁ COMPLETAMENTE SEGURO? Esta acción borrará todas las órdenes, ventas y movimientos de la base de datos.')) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await wipeDevData(password); // Usamos el password guardado en el state
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Error de red al intentar ejecutar la acción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="bg-error-container/10 border-2 border-error rounded-2xl p-6 md:p-8 shadow-2xl max-w-2xl mx-auto mt-10">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-error rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <span className="material-symbols-outlined text-white text-5xl">warning</span>
          </div>

          <div>
            <h2 className="text-3xl font-display-bold text-error uppercase tracking-widest mb-3">
              Zona Restringida
            </h2>
            <p className="text-on-surface text-lg font-bold uppercase mb-2">
              Modificación directa del núcleo
            </p>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto leading-relaxed text-justify">
              Está intentando acceder a las herramientas de desarrollo de la plataforma. Las opciones contenidas en esta sección tienen el poder de alterar y destruir irreversiblemente la base de datos de producción. Si usted no es parte del equipo de desarrollo, cierre esta ventana inmediatamente.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="w-full max-w-sm pt-6 space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface text-center text-xl tracking-widest text-on-surface focus:border-error focus:ring-1 focus:ring-error outline-none transition-all font-mono"
                placeholder="••••••••"
                autoComplete="current-password"
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="bg-error-container/30 border border-error/50 text-error text-sm p-3 rounded-lg animate-in fade-in zoom-in-95">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full bg-error text-white font-bold h-12 rounded-xl shadow-lg hover:bg-[#b91c1c] transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin">refresh</span>
              ) : (
                <span className="material-symbols-outlined">lock_open</span>
              )}
              {isSubmitting ? 'Verificando...' : 'Desbloquear Opciones'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- UNLOCKED STATE ---
  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 text-primary mb-6 border-b border-outline-variant pb-4">
          <span className="material-symbols-outlined text-2xl">developer_mode</span>
          <h2 className="text-xl font-bold">Opciones de Desarrollo Habilitadas</h2>
        </div>

        {errorMsg && (
          <div className="bg-error-container/30 border border-error/50 text-error text-sm p-4 rounded-xl flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined">error</span>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-[#ecfdf5] border border-[#10b981] text-[#065f46] text-sm p-4 rounded-xl flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined">check_circle</span>
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Tarjeta de Acción: Purgar Base de Datos */}
          <div className="bg-surface-container-lowest border border-error/40 rounded-xl p-5 hover:border-error hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-3xl">delete_forever</span>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Purgar Base de Datos</h3>
                <p className="text-xs text-on-surface-variant font-medium mt-1">Borrado en cascada (Órdenes, Ventas, Cuadres, Movimientos)</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-6 flex-1">
              Ejecuta una transacción masiva que elimina todos los registros operativos. Los catálogos de productos, servicios, clientes, vehículos y personal <strong>NO</strong> serán afectados. Ideal para limpiar datos de prueba antes de producción.
            </p>

            <button
              onClick={handleWipe}
              disabled={isSubmitting || !!successMsg}
              className="w-full bg-error/10 text-error border border-error/50 hover:bg-error hover:text-white font-bold h-10 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">skull</span>
              Ejecutar Purga
            </button>
          </div>

          {/* Placeholder para futuras opciones */}
          <div className="bg-surface-container border border-dashed border-outline-variant rounded-xl p-5 flex flex-col items-center justify-center text-center opacity-50 h-full min-h-[220px]">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">add_box</span>
            <p className="text-sm font-bold text-on-surface-variant">Próximas Herramientas</p>
            <p className="text-xs text-on-surface-variant mt-1">El espacio está listo para añadir más opciones de desarrollo según sea necesario.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
