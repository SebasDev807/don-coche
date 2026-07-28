'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { batchUpdateStock } from '@/actions/inventory';
import { PrimaryButton } from '@/components/ui';

const MySwal = withReactContent(Swal);

export interface CatalogItem {
  id: string;
  name: string;
  barCode: string | null;
  stock: number;
}

interface ScannedItem {
  id: string;
  product: CatalogItem;
  quantityToAdd: number;
}

interface BatchStockUpdateProps {
  catalog: CatalogItem[];
}

export function BatchStockUpdate({ catalog }: BatchStockUpdateProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);

  // Mantener el foco en el input siempre que sea posible, para no perder lecturas
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    
    if (!code) return;

    // Buscar en el catálogo
    const foundProduct = catalog.find(p => p.barCode === code);

    if (foundProduct) {
      setScannedItems(prev => {
        const existing = prev.find(item => item.id === foundProduct.id);
        if (existing) {
           return prev.map(item => 
             item.id === foundProduct.id 
             ? { ...item, quantityToAdd: item.quantityToAdd + 1 }
             : item
           );
        } else {
           return [{ id: foundProduct.id, product: foundProduct, quantityToAdd: 1 }, ...prev];
        }
      });
      
      // Efecto visual rápido
      setLastScannedId(foundProduct.id);
      setTimeout(() => setLastScannedId(null), 300);

    } else {
      // Si no existe, podemos emitir un sonido o mostrar un toast muy sutil,
      // pero para no bloquear el flujo rápido, solo limpiamos y tal vez un feedback visual.
      console.warn(`Código no encontrado: ${code}`);
    }

    setBarcodeInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSave = async () => {
    if (scannedItems.length === 0) return;

    setIsSubmitting(true);
    
    const itemsToUpdate = scannedItems.map(item => ({
      id: item.id,
      quantityToAdd: item.quantityToAdd
    }));

    const result = await batchUpdateStock(itemsToUpdate);

    setIsSubmitting(false);

    if (result.success) {
      MySwal.fire({
        title: '¡Stock Actualizado!',
        text: result.message,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        router.push('/inventario');
        router.refresh();
      });
    } else {
      MySwal.fire({
        title: 'Error',
        text: result.message,
        icon: 'error',
        confirmButtonColor: 'rgba(221, 213, 51, 1)',
        customClass: { confirmButton: '!text-black' }
      });
    }
  };

  const totalItems = scannedItems.reduce((acc, curr) => acc + curr.quantityToAdd, 0);

  return (
    <div className="max-w-4xl mx-auto bg-surface rounded-xl shadow-sm border border-outline-variant p-6 md:p-8 flex flex-col min-h-[500px]">
      
      {/* Lector input */}
      <form onSubmit={handleScan} className="mb-8">
        <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Escáner de Código de Barras</label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            disabled={isSubmitting}
            className="h-[64px] form-input w-full rounded-lg border-2 border-primary bg-surface focus:ring-primary focus:ring-4 transition-all pl-14 pr-4 text-headline-sm font-mono text-on-surface placeholder:text-secondary-fixed-dim"
            placeholder="Pase el láser por el producto..."
            autoFocus
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-primary">
            <span className="material-symbols-outlined text-[32px]">barcode_scanner</span>
          </div>
        </div>
        <p className="text-secondary text-sm mt-2">La lectura suma 1 unidad automáticamente al producto encontrado.</p>
      </form>

      {/* Lista de escaneados */}
      <div className="flex-grow bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden flex flex-col">
        <div className="bg-surface-container px-4 py-3 border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-title-md text-on-surface font-bold">Productos Escaneados</h3>
          <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-label-md font-bold">
            Total a ingresar: {totalItems}
          </span>
        </div>

        <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3">
          {scannedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-secondary opacity-50 py-10">
              <span className="material-symbols-outlined text-[64px] mb-4">inventory_2</span>
              <p className="font-body-lg">Esperando lecturas...</p>
            </div>
          ) : (
            scannedItems.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors duration-300 ${
                  lastScannedId === item.id 
                    ? 'bg-tertiary-container/30 border-tertiary' 
                    : 'bg-surface border-outline-variant'
                }`}
              >
                <div>
                  <h4 className="font-title-md text-on-surface mb-1">{item.product.name}</h4>
                  <span className="text-label-sm font-mono bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant">
                    {item.product.barCode || 'Sin código'}
                  </span>
                  <span className="text-label-sm text-secondary ml-3">
                    Stock actual: {item.product.stock}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-primary-container/20 rounded-lg overflow-hidden border border-primary/20">
                     <button 
                       type="button"
                       onClick={() => setScannedItems(prev => prev.map(i => i.id === item.id ? { ...i, quantityToAdd: Math.max(1, i.quantityToAdd - 1) } : i))}
                       className="w-10 h-10 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                     >
                       <span className="material-symbols-outlined">remove</span>
                     </button>
                     <div className="w-12 h-10 flex items-center justify-center font-title-lg text-primary font-bold bg-surface">
                       +{item.quantityToAdd}
                     </div>
                     <button 
                       type="button"
                       onClick={() => setScannedItems(prev => prev.map(i => i.id === item.id ? { ...i, quantityToAdd: i.quantityToAdd + 1 } : i))}
                       className="w-10 h-10 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                     >
                       <span className="material-symbols-outlined">add</span>
                     </button>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => setScannedItems(prev => prev.filter(i => i.id !== item.id))}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-error hover:bg-error/10 transition-colors"
                    title="Eliminar de la lista"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <hr className="border-outline-variant/50 border-t my-6" />

      <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4">
        <button
          type="button"
          onClick={() => router.push('/inventario')}
          className="cursor-pointer w-full sm:w-auto h-[56px] px-8 rounded-full border-2 border-outline-variant text-secondary font-cta text-cta hover:bg-surface-container-high transition-colors focus:ring-2 focus:ring-outline focus:outline-none"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <PrimaryButton 
          onClick={handleSave}
          disabled={isSubmitting || scannedItems.length === 0}
          className="w-full sm:w-auto h-[56px] px-10 disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="material-symbols-outlined animate-spin">refresh</span>
          ) : (
            <span className="material-symbols-outlined">save</span>
          )}
          Guardar Cambios
        </PrimaryButton>
      </div>
    </div>
  );
}
