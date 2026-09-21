"use client";

import { useState, useMemo } from "react";
import { Supplier, Product } from "@prisma/client";

import { createPurchaseInvoiceAction, createQuickProductAction } from "@/actions/purchases/purchases.actions";
import { useRouter } from "next/navigation";

// Definición simple del cliente. En producción, usar un autocompletado avanzado
export function NuevaCompraClient({ 
  initialSuppliers, 
  products: initialProducts, 
  adminId 
}: { 
  initialSuppliers: Supplier[], 
  products: any[], 
  adminId: string 
}) {
  const router = useRouter();
  
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [products, setProducts] = useState(initialProducts);
  
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [quickProductData, setQuickProductData] = useState({ name: "", unitCost: 0, salePrice: 0 });
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  
  const [items, setItems] = useState([{ productId: "", quantity: 1, unitCost: 0, subtotal: 0 }]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = newItems[index] as any;
    
    item[field] = value;
    
    if (field === "productId") {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        item.unitCost = Number(selectedProduct.unitCost);
      }
    }
    
    // Auto-calculate subtotal
    item.subtotal = Number(item.quantity) * Number(item.unitCost);
    
    setItems(newItems);
  };
  
  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, unitCost: 0, subtotal: 0 }]);
  };
  
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const handleQuickProductCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProduct(true);
    const result = await createQuickProductAction(quickProductData);
    if (result.success && result.data) {
      setProducts([...products, result.data].sort((a, b) => a.name.localeCompare(b.name)));
      setIsQuickProductModalOpen(false);
      setQuickProductData({ name: "", unitCost: 0, salePrice: 0 });
    } else {
      setError(result.error || "Ocurrió un error creando el producto.");
    }
    setIsCreatingProduct(false);
  };
  
  const subtotal = items.reduce((acc, item) => acc + (item.subtotal || 0), 0);
  const ivaAmount = 0; // Se podría calcular si fuera necesario por ítem
  const grandTotal = subtotal + ivaAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(item => !item.productId || item.quantity <= 0)) {
      setError("Todos los ítems deben tener un producto seleccionado y cantidad mayor a 0.");
      return;
    }
    
    if (!supplierId || !invoiceNumber) {
      setError("Selecciona el proveedor y escribe el número de factura.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const result = await createPurchaseInvoiceAction({
      supplierId,
      invoiceNumber,
      date: new Date(date),
      subtotal,
      ivaAmount,
      grandTotal,
      adminId,
      notes,
      items: items.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        subtotal: Number(item.subtotal)
      }))
    });
    
    if (result.success) {
      router.push("/compras");
    } else {
      setError(result.error || "Ocurrió un error inesperado.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface-container rounded-3xl p-8 max-w-4xl mx-auto w-full">
      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-8 fade-in">
        {/* Cabecera */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-6 rounded-2xl border border-outline-variant">
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-body-sm text-secondary font-medium">Proveedor *</label>
            <select 
              required
              className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">-- Seleccionar Proveedor --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} (NIT: {s.nit})</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-body-sm text-secondary font-medium">Factura Número *</label>
            <input 
              required
              type="text" 
              className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-body-sm text-secondary font-medium">Fecha *</label>
            <input 
              required
              type="date" 
              className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Detalle */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-title-md font-medium">Productos de la Factura</h3>
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setIsQuickProductModalOpen(true)}
                className="text-secondary hover:text-primary font-medium flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_box</span> Crear Producto
              </button>
              <button 
                type="button" 
                onClick={addItem}
                className="text-primary hover:text-primary-hover font-medium flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> Agregar Fila
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-center bg-surface p-4 rounded-2xl border border-outline-variant overflow-x-auto">
                <div className="flex-grow min-w-[250px]">
                  <select 
                    required
                    className="w-full bg-surface-container p-2 rounded-lg border border-outline-variant text-body-md"
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                  >
                    <option value="">Seleccione un producto</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - Actual: ${Number(p.unitCost)}</option>
                    ))}
                  </select>
                </div>
                
                <div className="w-24 shrink-0">
                  <label className="text-[10px] text-secondary uppercase block mb-1">Cant</label>
                  <input 
                    type="number" min="1" step="1" required
                    className="w-full bg-surface-container p-2 rounded-lg border border-outline-variant text-center"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  />
                </div>
                
                <div className="w-32 shrink-0">
                  <label className="text-[10px] text-secondary uppercase block mb-1">Costo Unit</label>
                  <input 
                    type="number" min="0" step="100" required
                    className="w-full bg-surface-container p-2 rounded-lg border border-outline-variant text-right"
                    value={item.unitCost}
                    onChange={(e) => handleItemChange(index, "unitCost", e.target.value)}
                  />
                </div>
                
                <div className="w-32 shrink-0 text-right">
                  <label className="text-[10px] text-secondary uppercase block mb-1">Subtotal</label>
                  <div className="font-medium p-2">
                    ${item.subtotal.toLocaleString('es-CO')}
                  </div>
                </div>
                
                <div className="shrink-0 pt-5">
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="p-2 text-error hover:bg-error-container rounded-lg disabled:opacity-30 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totales y Submit */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-surface p-6 rounded-2xl border border-outline-variant mt-4 gap-6">
          <div className="flex flex-col">
            <span className="text-secondary text-body-sm">Total Factura (Antes de guardar)</span>
            <span className="text-headline-md text-primary font-bold">
              ${grandTotal.toLocaleString('es-CO')}
            </span>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary-fixed text-black px-8 py-4 rounded-full font-medium text-title-sm hover:brightness-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Procesando..." : (
              <>
                <span className="material-symbols-outlined text-[24px]">check_circle</span> Confirmar Factura e Inventario
              </>
            )}
          </button>
        </div>
      </form>

      {isQuickProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-surface rounded-3xl p-8 max-w-md w-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-headline-sm">Creación Rápida</h2>
              <button type="button" onClick={() => setIsQuickProductModalOpen(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleQuickProductCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-body-sm text-secondary mb-1">Nombre del Producto *</label>
                <input
                  required
                  type="text"
                  className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
                  value={quickProductData.name}
                  onChange={(e) => setQuickProductData({ ...quickProductData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-body-sm text-secondary mb-1">Costo Unitario (Compra) *</label>
                <input
                  required
                  type="number" min="0" step="100"
                  className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
                  value={quickProductData.unitCost}
                  onChange={(e) => setQuickProductData({ ...quickProductData, unitCost: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-body-sm text-secondary mb-1">Precio de Venta (Público) *</label>
                <input
                  required
                  type="number" min="0" step="100"
                  className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
                  value={quickProductData.salePrice}
                  onChange={(e) => setQuickProductData({ ...quickProductData, salePrice: Number(e.target.value) })}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="px-6 py-2 rounded-full bg-primary-fixed text-black hover:brightness-95 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingProduct ? "Guardando..." : "Crear y Añadir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
