import React, { useState, useEffect, useRef } from 'react';

interface Insumo {
  id: string;
  name: string;
  stock: number;
  salePrice: number;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(24);
  const observerTarget = useRef<HTMLDivElement>(null);

  const filteredInsumos = insumos.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset visible count on search
  useEffect(() => {
    setVisibleCount(24);
  }, [searchTerm]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 24, filteredInsumos.length));
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [filteredInsumos.length]);

  const displayedInsumos = filteredInsumos.slice(0, visibleCount);

  return (
    <section className="w-full h-full bg-background flex flex-col overflow-hidden fade-in" data-purpose="insumos-panel">
      <div className="p-6 border-b border-surface-variant bg-surface-container-lowest">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg aria-hidden="true" className="h-5 w-5 text-on-surface-variant" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" fillRule="evenodd"></path>
            </svg>
          </div>
          <input 
            className="block w-full pl-11 pr-3 py-4 border border-outline rounded-full leading-5 bg-surface-container-lowest placeholder-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm text-on-surface cursor-pointer" 
            placeholder="Buscar Productos..." 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto">
        {filteredInsumos.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            No hay productos que coincidan con la búsqueda.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedInsumos.map((item) => {
                const selected = selectedProducts.find(p => p.productId === item.id);
                const isSelected = !!selected;
                const isOutOfStock = item.stock === 0;
                const price = Number(item.salePrice) || 0;

                return (
                  <div
                    key={item.id}
                    className={`relative bg-surface-container-lowest border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all h-full
                      ${isSelected
                        ? 'border-primary bg-primary-container/20 shadow-md'
                        : isOutOfStock 
                          ? 'border-surface-variant bg-surface-container opacity-50 cursor-not-allowed'
                          : 'border-surface-variant hover:border-primary hover:shadow-sm cursor-pointer'
                      }`}
                    onClick={(e) => {
                      // Prevent toggling when clicking the quantity buttons
                      if ((e.target as HTMLElement).closest('.qty-btn')) return;
                      if (!isOutOfStock) {
                        onToggleProduct?.(item.id, item.name, price);
                      }
                    }}
                  >
                    <div className={`flex gap-1 ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined text-4xl">
                        inventory_2
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center w-full">
                      <span className="text-sm font-medium text-on-surface text-center leading-tight mb-1 line-clamp-2">{item.name}</span>
                      <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                        ${price.toLocaleString()}
                      </span>
                    </div>

                    {isSelected ? (
                      <div className="flex items-center gap-3 mt-2 qty-btn">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onChangeProductQty?.(item.id, (selected.quantity || 1) - 1); }}
                          className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer text-on-surface font-bold shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[18px]">remove</span>
                        </button>
                        <span className="w-6 text-center font-black text-on-surface text-base">
                          {selected.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onChangeProductQty?.(item.id, (selected.quantity || 1) + 1); }}
                          className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer text-on-surface font-bold shadow-sm disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                      </div>
                    ) : (
                      <p className={`text-[11px] font-bold mt-1 ${item.stock <= 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                        {item.stock <= 0 ? 'Agotado' : 'Disponible'}
                      </p>
                    )}

                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-on-primary rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {visibleCount < filteredInsumos.length && (
              <div ref={observerTarget} className="h-10 w-full mt-4 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              </div>
            )}
          </>
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
