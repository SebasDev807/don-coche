'use client';

import { useState, useEffect, useRef } from 'react';
import { searchProductsAction } from '@/actions/inventory/search_products.action';

export interface SelectedProduct {
  productId: string;
  name: string;
  code: string | null;
  quantity: number;
  isRequired: boolean;
}

interface ProductSelectorProps {
  onProductsChange: (products: SelectedProduct[]) => void;
}

export function ProductSelector({ onProductsChange }: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsSearching(true);
        const result = await searchProductsAction(searchTerm);
        if (result.success && result.data) {
          setSuggestions(result.data);
          setShowSuggestions(true);
        }
        setIsSearching(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelectProduct = (product: any) => {
    // Avoid duplicates
    if (!selectedProducts.find(p => p.productId === product.id)) {
      const newSelected = [
        ...selectedProducts,
        {
          productId: product.id,
          name: product.name,
          code: product.code,
          quantity: 1,
          isRequired: true
        }
      ];
      setSelectedProducts(newSelected);
      onProductsChange(newSelected);
    }
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleRemoveProduct = (productId: string) => {
    const updated = selectedProducts.filter(p => p.productId !== productId);
    setSelectedProducts(updated);
    onProductsChange(updated);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    const updated = selectedProducts.map(p => 
      p.productId === productId ? { ...p, quantity } : p
    );
    setSelectedProducts(updated);
    onProductsChange(updated);
  };

  const handleToggleRequired = (productId: string) => {
    const updated = selectedProducts.map(p => 
      p.productId === productId ? { ...p, isRequired: !p.isRequired } : p
    );
    setSelectedProducts(updated);
    onProductsChange(updated);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="relative w-full" ref={searchContainerRef}>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
          <input
            type="text"
            className="w-full h-[56px] pl-12 pr-4 bg-surface border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-on-surface outline-none transition-colors"
            placeholder="Buscar producto por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
          />
          {isSearching && (
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-secondary">refresh</span>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelectProduct(product)}
                className="w-full text-left px-4 py-3 hover:bg-surface-container-high transition-colors flex justify-between items-center border-b border-outline-variant/50 last:border-0"
              >
                <div>
                  <div className="font-label-bold text-on-surface">{product.name}</div>
                  {product.code && <div className="text-body-sm text-secondary">Cód: {product.code}</div>}
                </div>
                <span className="material-symbols-outlined text-primary text-[20px]">add_circle</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Products List */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <h4 className="font-label-bold text-on-surface-variant">Productos Asociados ({selectedProducts.length})</h4>
          {selectedProducts.map((p) => (
            <div key={p.productId} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant rounded-lg">
              <div className="flex-1">
                <div className="font-body-lg text-on-surface">{p.name}</div>
                {p.code && <div className="text-body-sm text-secondary">Cód: {p.code}</div>}
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg">
                  <button type="button" onClick={() => handleUpdateQuantity(p.productId, p.quantity - 1)} className="p-1 rounded-md hover:bg-surface-container-high text-on-surface grid place-items-center">
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                  <span className="font-label-bold min-w-[20px] text-center">{p.quantity}</span>
                  <button type="button" onClick={() => handleUpdateQuantity(p.productId, p.quantity + 1)} className="p-1 rounded-md hover:bg-surface-container-high text-on-surface grid place-items-center">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={p.isRequired} 
                    onChange={() => handleToggleRequired(p.productId)}
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span className="text-body-sm text-on-surface">Requerido</span>
                </label>

                <button 
                  type="button" 
                  onClick={() => handleRemoveProduct(p.productId)}
                  className="p-2 text-error hover:bg-error/10 rounded-full transition-colors grid place-items-center"
                  title="Eliminar producto"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
