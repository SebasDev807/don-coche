'use client';

import { useState, useEffect } from 'react';
import { getClosureSummary, closeCashRegister } from '@/actions/caja/closure.actions';
import { ExportExcelButton } from '@/components/ui/ExportExcelButton';
import { useRouter } from 'next/navigation';

interface CashClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashClosureModal({ isOpen, onClose }: CashClosureModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<{
    totalCash: number;
    totalCard: number;
    totalTransfer: number;
    orderIds: string[];
  } | null>(null);

  const [reportedCash, setReportedCash] = useState<string>('');
  const [observations, setObservations] = useState('');
  
  const [closureId, setClosureId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setClosureId(null);
      setReportedCash('');
      setObservations('');
      setError(null);
      fetchSummary();
    }
  }, [isOpen]);

  const fetchSummary = async () => {
    setLoading(true);
    const result = await getClosureSummary();
    if (result.success && result.data) {
      setSummary(result.data);
    } else {
      setError(result.message || 'Error al obtener resumen');
    }
    setLoading(false);
  };

  const handleCloseRegister = async () => {
    if (!summary) return;
    
    const cashValue = Number(reportedCash);
    if (isNaN(cashValue)) {
      setError('Por favor, ingresa un monto válido de efectivo físico.');
      return;
    }

    setClosing(true);
    setError(null);

    const result = await closeCashRegister({
      reportedCash: cashValue,
      totalCash: summary.totalCash,
      totalCard: summary.totalCard,
      totalTransfer: summary.totalTransfer,
      observations,
      orderIds: summary.orderIds,
    });

    if (result.success && result.closureId) {
      setClosureId(result.closureId);
    } else {
      setError(result.message || 'Error al realizar el cierre de caja');
    }
    setClosing(false);
  };

  if (!isOpen) return null;

  const discrepancy = summary ? Number(reportedCash) - summary.totalCash : 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-scale-up">
        
        <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface-container">
          <h2 className="font-headline-sm text-on-surface">Cierre de Caja del Día</h2>
          {!closureId && (
            <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors cursor-pointer fade-in">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">autorenew</span>
              <p className="text-on-surface-variant">Calculando totales...</p>
            </div>
          ) : error && !closureId ? (
            <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-4">
              <p>{error}</p>
            </div>
          ) : closureId ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">¡Cierre Exitoso!</h3>
              <p className="text-on-surface-variant mb-8">El registro de caja se ha cerrado y guardado correctamente.</p>
              
              <div className="flex flex-col gap-4">
                <ExportExcelButton 
                  endpoint={`/api/v1/export/caja?closureId=${closureId}`}
                  label="Descargar Reporte (Excel)"
                  className="w-full cursor-pointer fade-in"
                />
                <button 
                  onClick={() => {
                    onClose();
                    router.refresh();
                  }}
                  className="btn-outline w-full cursor-pointer fade-in"
                >
                  Volver al Dashboard
                </button>
              </div>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              {summary.orderIds.length === 0 ? (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200 text-center">
                  <span className="material-symbols-outlined mb-2 text-3xl">warning</span>
                  <p>No hay órdenes pendientes por cerrar. Todas las órdenes facturadas ya han sido incluidas en un cierre.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-surface p-3 rounded-lg border border-surface-variant">
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Efectivo</p>
                      <p className="font-bold text-on-surface">${summary.totalCash.toLocaleString()}</p>
                    </div>
                    <div className="bg-surface p-3 rounded-lg border border-surface-variant">
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Tarjeta</p>
                      <p className="font-bold text-on-surface">${summary.totalCard.toLocaleString()}</p>
                    </div>
                    <div className="bg-surface p-3 rounded-lg border border-surface-variant">
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Transfer.</p>
                      <p className="font-bold text-on-surface">${summary.totalTransfer.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-surface-variant">
                    <div>
                      <label className="block text-sm font-medium text-on-surface mb-1">
                        Efectivo Físico en Caja <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                        <input 
                          type="number"
                          value={reportedCash}
                          onChange={(e) => setReportedCash(e.target.value)}
                          className="w-full h-12 pl-8 pr-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-2 focus:ring-primary transition-all text-on-surface"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {reportedCash !== '' && !isNaN(Number(reportedCash)) && (
                      <div className={`p-4 rounded-xl flex justify-between items-center ${
                        discrepancy === 0 ? 'bg-green-50 text-green-800 border border-green-200' :
                        discrepancy > 0 ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-error-container/50 text-on-error-container border border-error-container'
                      }`}>
                        <span className="font-medium">
                          {discrepancy === 0 ? 'Cuadre Exacto' : 
                           discrepancy > 0 ? 'Sobrante en Caja' : 
                           'Faltante en Caja'}
                        </span>
                        <span className="font-bold text-lg">
                          ${Math.abs(discrepancy).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-on-surface mb-1">
                        Observaciones (Opcional)
                      </label>
                      <textarea
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        className="w-full rounded-xl border border-outline-variant bg-surface p-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary transition-all resize-none"
                        rows={2}
                        placeholder="Motivo de descuadre, notas para gerencia..."
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        {!closureId && summary && summary.orderIds.length > 0 && (
          <div className="p-4 border-t border-surface-variant bg-surface-container flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={closing}
              className="btn-outline cursor-pointer fade-in"
            >
              Cancelar
            </button>
            <button
              onClick={handleCloseRegister}
              disabled={closing || reportedCash === ''}
              className="btn-primary !bg-yellow-500 hover:!bg-yellow-600 !text-yellow-950 border-none cursor-pointer fade-in font-bold px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              {closing ? 'Cerrando...' : 'Confirmar Cierre'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
