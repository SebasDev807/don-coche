import React from 'react';

interface Insumo {
  id: string;
  name: string;
  stock: number;
}

interface SelectedProduct {
  productId: string;
  quantity: number;
  name: string;
  unitPrice: number;
}

interface InsumosPanelProps {
  insumos: Insumo[];
  selectedProducts?: SelectedProduct[];
  onToggleProduct?: (productId: string, name: string, unitPrice: number) => void;
  onChangeProductQty?: (productId: string, quantity: number) => void;
}

export const InsumosPanel = ({
  insumos,
  selectedProducts = [],
  onToggleProduct,
  onChangeProductQty,
}: InsumosPanelProps) => {
  return (
    <section className="w-full h-full bg-background flex flex-col overflow-hidden fade-in" data-purpose="insumos-panel">
      <div className="p-6 border-b border-surface-variant bg-surface-container-lowest">
        <h2 className="text-lg font-bold text-on-surface leading-tight">Stock de Insumos</h2>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Selecciona los productos que usaste para incluirlos en la factura del cliente.
        </p>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto">
        {insumos.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            No hay insumos registrados.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {insumos.map((item) => {
              const selected = selectedProducts.find(p => p.productId === item.id);
              const isSelected = !!selected;
              const isOutOfStock = item.stock === 0;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : isOutOfStock
                      ? 'border-surface-variant bg-surface-container opacity-50'
                      : 'border-surface-variant bg-surface-container-low hover:border-primary/40'
                  }`}
                >
                  {/* Checkbox / toggle */}
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => onToggleProduct?.(item.id, item.name, 0)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:cursor-not-allowed ${
                      isSelected
                        ? 'bg-primary border-primary text-on-primary'
                        : 'border-outline bg-surface'
                    }`}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </button>

                  {/* Nombre */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-sm truncate">{item.name}</p>
                    <p className={`text-[11px] font-bold mt-0.5 ${item.stock <= 5 ? 'text-error' : 'text-on-surface-variant'}`}>
                      {item.stock <= 0 ? 'Sin stock' : `${item.stock} disponibles`}
                    </p>
                  </div>

                  {/* Control de cantidad (solo si está seleccionado) */}
                  {isSelected && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onChangeProductQty?.(item.id, (selected.quantity || 1) - 1)}
                        className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer text-on-surface font-bold"
                      >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="w-6 text-center font-black text-on-surface text-sm">
                        {selected.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onChangeProductQty?.(item.id, (selected.quantity || 1) + 1)}
                        disabled={(selected.quantity || 1) >= item.stock}
                        className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer text-on-surface font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                  )}

                  {/* Stock badge (cuando no está seleccionado) */}
                  {!isSelected && (
                    <div className="flex flex-col items-end shrink-0">
                      <span className={`font-black text-xl ${item.stock <= 5 ? 'text-error' : 'text-primary'}`}>
                        {item.stock}
                      </span>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                        Stock
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumen de productos seleccionados */}
      {selectedProducts.length > 0 && (
        <div className="p-4 border-t border-surface-variant bg-surface-container-lowest">
          <p className="text-xs font-black text-on-surface-variant uppercase tracking-wider mb-2">
            Productos a facturar ({selectedProducts.length})
          </p>
          <div className="space-y-1">
            {selectedProducts.map(p => (
              <div key={p.productId} className="flex justify-between text-sm">
                <span className="text-on-surface">{p.name} ×{p.quantity}</span>
                <span className="font-bold text-primary">→ Caja</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-2">
            Estos productos se incluirán en la factura del cliente al enviar a caja.
          </p>
        </div>
      )}
    </section>
  );
};
