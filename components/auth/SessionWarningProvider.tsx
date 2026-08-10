'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSessionExpiryAction, extendSessionAction, logoutAction } from '@/actions/auth.actions';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export function SessionWarningProvider({ children }: { children: React.ReactNode }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const WARNING_MINUTES = 5;

  const checkSession = useCallback(async () => {
    try {
      const expiresAt = await getSessionExpiryAction();
      if (!expiresAt) return;

      const timeRemainingMs = expiresAt.getTime() - Date.now();
      const minutesRemaining = timeRemainingMs / 1000 / 60;

      if (minutesRemaining <= WARNING_MINUTES && minutesRemaining > 0) {
        setShowModal(true);
      } else if (minutesRemaining <= 0) {
        // Expirado, hacemos logout automáticamente si está abierto y no ha renovado
        await logoutAction();
      } else {
        // Volver a revisar justo un poco antes de la advertencia
        const timeUntilWarning = timeRemainingMs - (WARNING_MINUTES * 60 * 1000);
        if (timeUntilWarning > 0) {
          setTimeout(checkSession, timeUntilWarning);
        } else {
          setTimeout(checkSession, 10000);
        }
      }
    } catch (error) {
      console.error('Failed to check session', error);
    }
  }, []);

  useEffect(() => {
    checkSession();
    // Revisar cada minuto por si la pestaña estuvo inactiva
    const interval = setInterval(checkSession, 60 * 1000);
    return () => clearInterval(interval);
  }, [checkSession]);

  const handleContinue = async () => {
    setLoading(true);
    const success = await extendSessionAction();
    if (success) {
      setShowModal(false);
      checkSession();
    } else {
      await logoutAction();
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    await logoutAction();
  };

  return (
    <>
      {children}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-6 shadow-xl">
            <h2 className="mb-2 text-xl font-medium text-on-surface">Sesión a punto de expirar</h2>
            <p className="mb-6 text-on-surface-variant">
              Tu jornada laboral está a punto de finalizar (8 horas). ¿Deseas continuar tu sesión y registrar el tiempo adicional como horas extra?
            </p>
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full rounded-lg border border-outline-variant px-6 py-2.5 font-medium text-primary hover:bg-surface-container disabled:opacity-50"
              >
                Cerrar sesión
              </button>
              <PrimaryButton
                onClick={handleContinue}
                disabled={loading}
                className="w-full disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Continuar'}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
