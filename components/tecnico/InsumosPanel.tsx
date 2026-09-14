import React from 'react';

interface Insumo {
  id: string;
  name: string;
  stock: number;
}

interface InsumosPanelProps {
  insumos: Insumo[];
}

export const InsumosPanel = ({ insumos }: InsumosPanelProps) => {
  return (
    <section className="w-full h-full bg-background flex flex-col overflow-hidden fade-in" data-purpose="insumos-panel">
      <div className="p-6 border-b border-surface-variant bg-surface-container-lowest">
        <h2 className="text-lg font-bold text-on-surface leading-tight">Stock de Insumos</h2>
        <p className="text-sm text-on-surface-variant">Consulta el inventario disponible. Solicita en caja lo que haga falta.</p>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto">
        {insumos.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            No hay insumos registrados.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {insumos.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-5 rounded-2xl border border-surface-variant bg-surface-container-low hover:border-primary/50 transition-colors shadow-sm">
                <span className="font-bold text-on-surface truncate pr-4 text-sm">{item.name}</span>
                <div className="flex flex-col items-end shrink-0">
                  <span className={`font-black text-2xl ${item.stock <= 5 ? 'text-error' : 'text-primary'}`}>
                    {item.stock}
                  </span>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                    Stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
