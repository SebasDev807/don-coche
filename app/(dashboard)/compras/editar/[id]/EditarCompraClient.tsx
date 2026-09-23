"use client";

import { useEffect, useRef, useState, } from "react";
import { Supplier } from "@prisma/client";

import { updatePurchaseInvoiceAction, createQuickProductAction, updateQuickProductAction, createQuickSupplierAction } from "@/actions/purchases/purchases.actions";
import { useRouter } from "next/navigation";
import { useSellingPrice } from "@/hooks";
import { parseLocalizedNumber } from "@/lib/utils/parseLocalizedNumber";

export function EditarCompraClient({
  initialInvoice,
  initialSuppliers,
  products: initialProducts,
  categories,
  adminId
}: {
  initialInvoice: any;
  initialSuppliers: Supplier[],
  products: any[],
  categories: any[],
  adminId: string
}) {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [products, setProducts] = useState(initialProducts);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [quickProductData, setQuickProductData] = useState({
    name: "",
    categoryId: "",
    barCode: "",
    stock: "",
    unitCost: "",
    profitPercentage: "",
    hasIva: false,
    iva: 0,
    autoRound: true,
  });

  const { sellingPrice, formattedSellingPrice } = useSellingPrice(
    quickProductData.unitCost,
    quickProductData.profitPercentage,
    quickProductData.iva,
    quickProductData.hasIva,
    quickProductData.autoRound
  );
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const [isQuickSupplierModalOpen, setIsQuickSupplierModalOpen] = useState(false);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [quickSupplierData, setQuickSupplierData] = useState({ nit: "", name: "", phone: "", email: "" });

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [supplierId, setSupplierId] = useState(initialInvoice.supplierId);
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoice.invoiceNumber);
  const [date, setDate] = useState(new Date(initialInvoice.date).toISOString().split("T")[0]);
  const [notes, setNotes] = useState(initialInvoice.notes || "");

  const [items, setItems] = useState(initialInvoice.items.map((i: any) => ({
    productId: i.productId,
    quantity: i.quantity as unknown as number,
    unitCost: i.unitCost as unknown as number,
    subtotal: i.subtotal
  })));

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
    setItems([...items, { productId: "", quantity: "" as unknown as number, unitCost: "" as unknown as number, subtotal: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_: any, i: number) => i !== index));
  };

  const handleEditProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setEditingProductId(productId);

    // El costo en BD ya incluye IVA
    const productIva = Number(product.iva) || 0;
    const originalCost = Number(product.unitCost);

    setQuickProductData({
      name: product.name,
      categoryId: product.categoryId || "",
      barCode: product.barCode || "",
      stock: "",
      unitCost: originalCost.toString(),
      profitPercentage: product.profitPercentage?.toString() || "",
      hasIva: Number(product.iva) > 0,
      iva: Number(product.iva) || 0,
      autoRound: true,
    });
    setIsQuickProductModalOpen(true);
  };

  const prevIvaRateRef = useRef(0);

  useEffect(() => {
    const currentIvaRate = quickProductData.hasIva ? (typeof quickProductData.iva === 'number' ? quickProductData.iva : parseFloat(String(quickProductData.iva)) || 0) : 0;

    if (prevIvaRateRef.current !== currentIvaRate) {
      const raw = quickProductData.unitCost;
      if (raw.trim()) {
        const num = parseLocalizedNumber(raw);
        if (num > 0) {
          const oldIvaRate = prevIvaRateRef.current;
          const baseCost = num / (1 + oldIvaRate / 100);
          const newCost = baseCost * (1 + currentIvaRate / 100);
          setQuickProductData(prev => ({
            ...prev,
            unitCost: new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(newCost)
          }));
        }
      }
      prevIvaRateRef.current = currentIvaRate;
    }
  }, [quickProductData.hasIva, quickProductData.iva, quickProductData.unitCost]);

  useEffect(() => {
    if (!quickProductData.hasIva && quickProductData.iva !== 0) {
      setQuickProductData(prev => ({ ...prev, iva: 0 }));
    }
  }, [quickProductData.hasIva, quickProductData.iva]);

  const handleQuickProductCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProduct(true);
    const rawCostValue = typeof quickProductData.unitCost === 'string' ? parseLocalizedNumber(quickProductData.unitCost) : quickProductData.unitCost;
    const costValue = rawCostValue; // El IVA ya se sumó en el onBlur
    const selectedCat = categories.find(c => c.id === quickProductData.categoryId);
    const isInsumos = selectedCat?.name.toLowerCase().includes('insumo') || false;

    if (editingProductId) {
      const result = await updateQuickProductAction(editingProductId, {
        name: quickProductData.name,
        barCode: quickProductData.barCode,
        categoryId: quickProductData.categoryId || undefined,
        stock: undefined,
        unitCost: costValue,
        salePrice: isInsumos ? 0 : sellingPrice,
        profitPercentage: isInsumos ? 0 : (quickProductData.profitPercentage ? Number(quickProductData.profitPercentage) : undefined),
        iva: quickProductData.hasIva ? quickProductData.iva : 0
      });
      if (result.success && result.data) {
        const updatedProduct = result.data;
        setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p).sort((a, b) => a.name.localeCompare(b.name)));

        setItems(items.map((item: any) => {
          if (item.productId === updatedProduct.id) {
            return {
              ...item,
              unitCost: Number(updatedProduct.unitCost) as unknown as number,
              subtotal: Number(item.quantity) * Number(updatedProduct.unitCost)
            };
          }
          return item;
        }));

        setIsQuickProductModalOpen(false);
        setEditingProductId(null);
        setQuickProductData({
          name: "",
          categoryId: "",
          barCode: "",
          stock: "",
          unitCost: "",
          profitPercentage: "",
          hasIva: false,
          iva: 0,
          autoRound: true,
        });
      } else {
        setError(result.error || "Ocurrió un error actualizando el producto.");
      }
    } else {
      const result = await createQuickProductAction({
        name: quickProductData.name,
        barCode: quickProductData.barCode,
        categoryId: quickProductData.categoryId || undefined,
        stock: quickProductData.stock ? Number(quickProductData.stock) : 0,
        unitCost: costValue,
        salePrice: isInsumos ? 0 : sellingPrice,
        profitPercentage: isInsumos ? 0 : (quickProductData.profitPercentage ? Number(quickProductData.profitPercentage) : undefined),
        iva: quickProductData.hasIva ? quickProductData.iva : 0
      });
      if (result.success && result.data) {
        const newProduct = result.data;
        setProducts([...products, newProduct].sort((a, b) => a.name.localeCompare(b.name)));

        const newItems = [...items];
        const emptyRowIndex = newItems.findIndex((i: any) => !i.productId);
        const productQuantity = quickProductData.stock ? Number(quickProductData.stock) : 1;
        const unitCostNumber = Number(newProduct.unitCost);

        if (emptyRowIndex >= 0) {
          newItems[emptyRowIndex] = {
            productId: newProduct.id,
            quantity: productQuantity as unknown as number,
            unitCost: unitCostNumber as unknown as number,
            subtotal: productQuantity * unitCostNumber
          };
        } else {
          newItems.push({
            productId: newProduct.id,
            quantity: productQuantity as unknown as number,
            unitCost: unitCostNumber as unknown as number,
            subtotal: productQuantity * unitCostNumber
          });
        }
        setItems(newItems);

        setIsQuickProductModalOpen(false);
        setQuickProductData({
          name: "",
          categoryId: "",
          barCode: "",
          stock: "",
          unitCost: "",
          profitPercentage: "",
          hasIva: false,
          iva: 0,
          autoRound: true,
        });
      } else {
        setError(result.error || "Ocurrió un error creando el producto.");
      }
    }
    setIsCreatingProduct(false);
  };

  const subtotal = items.reduce((acc: number, item: any) => acc + (item.subtotal || 0), 0);
  const ivaAmount = 0; // Se podría calcular si fuera necesario por ítem
  const grandTotal = subtotal + ivaAmount;

  const handleQuickSupplierCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSupplier(true);
    const result = await createQuickSupplierAction(quickSupplierData);
    if (result.success && result.data) {
      setSuppliers([...suppliers, result.data].sort((a, b) => a.name.localeCompare(b.name)));
      setSupplierId(result.data.id);
      setIsQuickSupplierModalOpen(false);
      setQuickSupplierData({ nit: "", name: "", phone: "", email: "" });
    } else {
      setError(result.error || "Ocurrió un error creando el proveedor.");
    }
    setIsCreatingSupplier(false);
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("La factura debe tener al menos un producto.");
      return;
    }
    if (items.some((item: any) => !item.productId || item.quantity <= 0)) {
      setError("Todos los ítems deben tener un producto seleccionado y cantidad mayor a 0.");
      return;
    }
    if (!supplierId || !invoiceNumber) {
      setError("Selecciona el proveedor y escribe el número de factura.");
      return;
    }
    setError(null);
    setIsPreviewModalOpen(true);
  };

  const confirmSubmit = async () => {
    setIsPreviewModalOpen(false);
    setIsLoading(true);
    setError(null);

    const result = await updatePurchaseInvoiceAction(initialInvoice.id, {
      supplierId,
      invoiceNumber,
      date: new Date(date),
      subtotal,
      ivaAmount,
      grandTotal,
      adminId,
      notes,
      items: items.map((item: any) => ({
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

      <form onSubmit={handlePreview} className="flex flex-col gap-8 fade-in">
        {/* Cabecera */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-6 rounded-2xl border border-outline-variant">
          <div className="flex flex-col gap-2 md:col-span-2">
            <div className="flex justify-between items-end">
              <label className="text-body-sm text-secondary font-medium">Proveedor *</label>
              <button
                type="button"
                onClick={() => setIsQuickSupplierModalOpen(true)}
                className="text-primary hover:text-primary-hover font-medium flex items-center gap-1 text-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span> Nuevo Proveedor
              </button>
            </div>
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
                onClick={() => {
                  setEditingProductId(null);
                  setQuickProductData({ name: "", categoryId: "", barCode: "", stock: "", unitCost: "", profitPercentage: "", hasIva: true, iva: 19, autoRound: true });
                  setIsQuickProductModalOpen(true);
                }}
                className="flex items-center gap-1 text-primary text-label-lg font-bold hover:brightness-90 transition-all cursor-pointer"
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
            {items.map((item: any, index: number) => (
              <div key={index} className="flex gap-4 items-center bg-surface p-4 rounded-2xl border border-outline-variant flex-wrap md:flex-nowrap">
                <div className="flex-grow w-full md:w-auto md:min-w-[250px] min-w-0">
                  <div className="flex items-center w-full gap-2">
                    <select
                      required
                      className="w-full bg-surface-container p-2 rounded-lg border border-outline-variant text-body-md truncate min-w-0"
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                    >
                      <option value="">Seleccione un producto</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - Actual: ${Number(p.unitCost)}</option>
                      ))}
                    </select>
                    {item.productId && (
                      <button
                        type="button"
                        onClick={() => handleEditProduct(item.productId)}
                        className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors cursor-pointer"
                        title="Editar Producto"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-24 shrink-0">
                  <label className="text-[10px] text-secondary uppercase block mb-1">Cant</label>
                  <input
                    type="number" min="1" step="1" required placeholder="0"
                    className="w-full bg-surface-container p-2 rounded-lg border border-outline-variant text-center"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  />
                </div>

                <div className="w-32 shrink-0">
                  <label className="text-[10px] text-secondary uppercase block mb-1">Costo Unit</label>
                  <input
                    type="number" min="0" step="any" required placeholder="0"
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
                <span className="material-symbols-outlined text-[24px]">check_circle</span> Actualizar Factura e Inventario
              </>
            )}
          </button>
        </div>
      </form>

      {isQuickProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-surface rounded-3xl p-8 max-w-md w-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-title-lg text-title-lg text-on-surface">
                {editingProductId ? "Editar Producto" : "Crear Producto Rápidamente"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsQuickProductModalOpen(false);
                  setEditingProductId(null);
                }}
                className="text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleQuickProductCreate} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
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
                  <label className="block text-body-sm text-secondary mb-1">Código de Barras</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
                    value={quickProductData.barCode}
                    onChange={(e) => setQuickProductData({ ...quickProductData, barCode: e.target.value })}
                  />
                </div>
                {!editingProductId && (
                  <div>
                    <label className="block text-body-sm text-secondary mb-1">Stock Inicial</label>
                    <input
                      type="number" min="0" step="1" placeholder="0"
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
                      value={quickProductData.stock}
                      onChange={(e) => setQuickProductData({ ...quickProductData, stock: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-body-sm text-secondary mb-1">Categoría</label>
                <select
                  className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
                  value={quickProductData.categoryId}
                  onChange={(e) => {
                    const val = e.target.value;
                    const cat = categories.find(c => c.id === val);
                    const isInsumos = cat?.name.toLowerCase().includes('insumo');
                    setQuickProductData({
                      ...quickProductData,
                      categoryId: val,
                      profitPercentage: isInsumos ? "" : quickProductData.profitPercentage
                    });
                  }}
                >
                  <option value="">Ninguna</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-body-sm text-secondary mb-1">Costo Unitario (Compra) *</label>
                <input
                  required
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
                  value={quickProductData.unitCost}
                  onChange={(e) => setQuickProductData({ ...quickProductData, unitCost: e.target.value })}
                  onBlur={(e) => {
                    const raw = e.target.value;
                    if (!raw.trim()) return;
                    const num = parseLocalizedNumber(raw);
                    if (num > 0) {
                      setQuickProductData({
                        ...quickProductData,
                        unitCost: new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num)
                      });
                    }
                  }}
                />
              </div>

              {(() => {
                const selectedCat = categories.find(c => c.id === quickProductData.categoryId);
                const isInsumos = selectedCat?.name.toLowerCase().includes('insumo') || false;

                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {!isInsumos && (
                        <div>
                          <label className="block text-body-sm text-secondary mb-1">Margen Ganancia [%]</label>
                          <input
                            required
                            type="number" min="0" step="any" placeholder="15"
                            className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
                            value={quickProductData.profitPercentage}
                            onChange={(e) => setQuickProductData({ ...quickProductData, profitPercentage: e.target.value })}
                          />
                        </div>
                      )}
                      {/* IVA [%] */}
                      <div className={isInsumos ? "col-span-2" : ""}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-body-sm text-secondary">IVA [%]</label>
                          <label className="flex items-center gap-1 cursor-pointer text-[10px] text-secondary">
                            <input
                              type="checkbox"
                              checked={quickProductData.hasIva}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setQuickProductData({
                                  ...quickProductData,
                                  hasIva: isChecked,
                                  iva: 0
                                });
                              }}
                              className="w-3 h-3"
                            />
                            Incluir
                          </label>
                        </div>
                        <input
                          required
                          type="number" min="0" step="any" disabled={!quickProductData.hasIva}
                          className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none disabled:opacity-50"
                          value={quickProductData.iva}
                          onChange={(e) => setQuickProductData({ ...quickProductData, iva: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    {!isInsumos && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-body-sm text-secondary">Precio de Venta (Público) *</label>
                          <label className="flex items-center gap-1 cursor-pointer text-[10px] text-secondary">
                            <input
                              type="checkbox"
                              checked={quickProductData.autoRound}
                              onChange={(e) => setQuickProductData({ ...quickProductData, autoRound: e.target.checked })}
                              className="w-3 h-3"
                            />
                            Redondear a $50
                          </label>
                        </div>
                        <input
                          readOnly
                          type="text"
                          className="w-full bg-surface-container-highest p-3 rounded-xl border border-outline-variant text-on-surface-variant cursor-not-allowed"
                          value={formattedSellingPrice}
                        />
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickProductModalOpen(false);
                    setEditingProductId(null);
                  }}
                  className="px-6 py-2 rounded-full border border-outline-variant font-medium text-secondary hover:bg-surface-container cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="px-6 py-2 rounded-full bg-primary-fixed text-black font-medium hover:brightness-95 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingProduct ? (
                    <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Guardando...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">save</span> {editingProductId ? "Guardar Cambios" : "Crear y Añadir"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isQuickSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-surface rounded-3xl p-8 max-w-md w-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-headline-sm">Nuevo Proveedor</h2>
              <button type="button" onClick={() => setIsQuickSupplierModalOpen(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <form onSubmit={handleQuickSupplierCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-body-sm text-secondary mb-1">NIT / Documento *</label>
                <input required type="text" className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary" value={quickSupplierData.nit} onChange={(e) => setQuickSupplierData({ ...quickSupplierData, nit: e.target.value })} />
              </div>
              <div>
                <label className="block text-body-sm text-secondary mb-1">Nombre o Razón Social *</label>
                <input required type="text" className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary" value={quickSupplierData.name} onChange={(e) => setQuickSupplierData({ ...quickSupplierData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm text-secondary mb-1">Teléfono</label>
                  <input type="text" className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary" value={quickSupplierData.phone} onChange={(e) => setQuickSupplierData({ ...quickSupplierData, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-body-sm text-secondary mb-1">Email</label>
                  <input type="email" className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary" value={quickSupplierData.email} onChange={(e) => setQuickSupplierData({ ...quickSupplierData, email: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsQuickSupplierModalOpen(false)} className="px-6 py-2 rounded-full border border-outline-variant text-secondary">Cancelar</button>
                <button type="submit" disabled={isCreatingSupplier} className="px-6 py-2 rounded-full bg-primary-fixed text-black hover:brightness-95 transition-colors disabled:opacity-50">
                  {isCreatingSupplier ? "Guardando..." : "Guardar Proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-surface rounded-3xl p-8 max-w-lg w-full shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-outline-variant pb-4">
              <h2 className="text-headline-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Resumen de Factura
              </h2>
              <button type="button" onClick={() => setIsPreviewModalOpen(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div className="bg-surface-container rounded-xl p-4 flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-secondary">Proveedor:</span>
                  <span className="font-medium">{suppliers.find(s => s.id === supplierId)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Factura No:</span>
                  <span className="font-medium">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Fecha:</span>
                  <span className="font-medium">{date}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-body-lg mb-2">Artículos ({items.length})</h4>
                <div className="bg-surface-container rounded-xl overflow-hidden">
                  <div className="max-h-48 overflow-y-auto p-2">
                    {items.map((item: any, idx: number) => {
                      const p = products.find(prod => prod.id === item.productId);
                      return (
                        <div key={idx} className="flex justify-between items-center p-2 border-b border-outline-variant/30 last:border-0 text-body-sm">
                          <div className="truncate pr-2 w-1/2">
                            {item.quantity}x {p?.name || 'Desconocido'}
                          </div>
                          <div className="font-medium">
                            ${(Number(item.quantity) * Number(item.unitCost)).toLocaleString('es-CO')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-primary-container/20 rounded-xl p-4 flex flex-col gap-1 text-right">
                <div className="flex justify-between text-secondary">
                  <span>Subtotal:</span>
                  <span>${subtotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-headline-sm font-bold text-primary mt-2 pt-2 border-t border-outline-variant/50">
                  <span>Total:</span>
                  <span>${grandTotal.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setIsPreviewModalOpen(false)} className="px-6 py-3 rounded-full border-2 border-outline-variant text-secondary font-medium hover:bg-surface-container">
                Editar Datos
              </button>
              <button type="button" onClick={confirmSubmit} disabled={isLoading} className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-black font-bold hover:brightness-95 shadow-md">
                <span className="material-symbols-outlined">save</span> Confirmar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
