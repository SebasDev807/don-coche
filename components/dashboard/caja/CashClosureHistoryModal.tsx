'use client';

import { useState, useEffect } from 'react';
import { getHistoricalClosures } from '@/actions/caja/closure.actions';

interface CashClosureHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashClosureHistoryModal({ isOpen, onClose }: CashClosureHistoryModalProps) {
  const [closures, setClosures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  async function loadHistory() {
    setIsLoading(true);
    try {
      const result = await getHistoricalClosures();
      if (result.success && result.data) {
        setClosures(result.data);
      }
    } catch (error) {
      console.error('Failed to load history', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 fade-in">
      <div className="bg-surface-container-lowest rounded-3xl w-full max-w-5xl shadow-elevation-3 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-surface-variant bg-surface-container">
          <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">history</span>
            Historial de Cierres de Caja
          </h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-container-lowest">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-2">refresh</span>
              <p className="text-on-surface-variant font-medium">Cargando historial...</p>
            </div>
          ) : closures.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-outline-variant rounded-2xl bg-surface-container">
              <span className="material-symbols-outlined text-5xl text-outline mb-2">inventory_2</span>
              <p className="text-on-surface-variant font-medium text-lg">No hay cierres históricos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-surface-variant shadow-sm">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-container-high border-b border-surface-variant text-on-surface-variant sticky top-0">
                  <tr>
                    <th className="py-4 px-5 font-label-bold uppercase text-xs tracking-wider">Fecha / Hora</th>
                    <th className="py-4 px-5 font-label-bold uppercase text-xs tracking-wider">Responsable</th>
                    <th className="py-4 px-5 font-label-bold uppercase text-xs tracking-wider text-right">Ef. Sistema</th>
                    <th className="py-4 px-5 font-label-bold uppercase text-xs tracking-wider text-right">Ef. Reportado</th>
                    <th className="py-4 px-5 font-label-bold uppercase text-xs tracking-wider text-right">Descuadre</th>
                    <th className="py-4 px-5 font-label-bold uppercase text-xs tracking-wider text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {closures.map(closure => (
                    <tr key={closure.id} className="hover:bg-surface-container transition-colors group">
                      <td className="py-3 px-5 text-on-surface font-medium">
                        {new Date(closure.createdAt).toLocaleString('es-CO', { 
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-5 text-on-surface-variant">
                        {closure.admin?.name || 'Desconocido'}
                      </td>
                      <td className="py-3 px-5 text-right font-medium text-on-surface">
                        ${closure.totalCash.toLocaleString()}
                      </td>
                      <td className="py-3 px-5 text-right font-medium text-on-surface">
                        ${closure.reportedCash.toLocaleString()}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <span className={`font-bold ${closure.discrepancy < 0 ? 'text-error' : closure.discrepancy > 0 ? 'text-primary' : 'text-on-surface-variant'}`}>
                          ${closure.discrepancy.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <a
                          href={`/api/v1/export/caja?closureId=${closure.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-full font-label-bold text-xs transition-colors"
                          title="Descargar Excel"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          Excel
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
