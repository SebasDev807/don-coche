'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { wipeDevData, verifyDevPassword } from '@/actions/dev/dev.actions';

export function DevToolsClient() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isUnlocked) {
      const audio = new Audio('/advertencia.mp3');
      // Loop the audio for continuous warning, or just play once
      audio.play().catch((e) => console.warn('El navegador bloqueó la reproducción automática del audio.', e));

      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [isUnlocked]);

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
      <div className="fixed inset-0 z-[100] bg-[#7f1d1d] overflow-y-auto flex flex-col items-center justify-center p-4 text-white font-serif">
        <div className="flex flex-col items-center text-center space-y-6 w-full max-w-3xl py-10">
          <div className="flex items-center justify-center mb-2">
            <Image 
              src="/images/caution.png" 
              alt="Precaución" 
              width={160} 
              height={160} 
              className="drop-shadow-2xl"
              priority
            />
          </div>

          <div>
            <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-[0.2em] mb-4 text-white drop-shadow-md">
              Zona Restringida
            </h2>
            <p className="text-red-200 text-xl uppercase mb-4 tracking-[0.3em] font-bold">
              Modificación Directa del Núcleo
            </p>
            <p className="text-red-100/90 text-base md:text-lg max-w-2xl mx-auto leading-relaxed text-justify px-4">
              Esta sección está destinada exclusivamente al equipo de desarrollo. Sus herramientas pueden modificar datos y procesos críticos de producción. El uso, acceso o manipulación no autorizada, especialmente con fines malintencionados, puede ser registrado, investigado y dar lugar a acciones administrativas o legales. Si usted no es del equipo de desarrollo o accedió accidentalmente a este sitio, abandone esta sección inmediatamente.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="w-full max-w-md pt-6 space-y-5">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-4 rounded-none border-2 border-red-900 bg-black/50 text-center text-2xl tracking-[0.5em] text-white placeholder:text-red-900/50 focus:border-white focus:ring-1 focus:ring-white outline-none transition-all font-mono"
                placeholder="••••••••"
                autoComplete="new-password"
                autoCorrect="off"
                spellCheck="false"
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="bg-black/50 border-l-4 border-white text-white text-sm p-4 text-left font-sans shadow-inner">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full bg-black hover:bg-black/80 text-white font-bold h-14 border-2 border-transparent hover:border-white transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.3em] shadow-2xl text-base"
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
              ) : (
                <span className="material-symbols-outlined text-xl">key</span>
              )}
              {isSubmitting ? 'Verificando...' : 'Desbloquear'}
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
