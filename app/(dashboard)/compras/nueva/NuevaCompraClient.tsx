"use client";

import { useState, useMemo, useEffect } from "react";
import { Supplier, Product } from "@prisma/client";

import { createPurchaseInvoiceAction, createQuickProductAction, updateQuickProductAction, createQuickSupplierAction } from "@/actions/purchases/purchases.actions";
import { useRouter } from "next/navigation";
import { useSellingPrice } from "@/hooks";
import { parseLocalizedNumber } from "@/lib/utils/parseLocalizedNumber";
import { calculateInvoiceTotals, getItemTotals } from "@/lib/utils/invoiceCalculator";

const DRAFT_KEY = "nueva_compra_draft";

// Definición simple del cliente. En producción, usar un autocompletado avanzado
export function NuevaCompraClient({
  initialSuppliers,
  products: initialProducts,
  categories,
  adminId
}: {
  initialSuppliers: Supplier[],
  products: any[],
  categories: any[],
  adminId: string
}) {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [products, setProducts] = useState(initialProducts);

  const productsById = useMemo(() => new Map<string, any>(products.map((p: any) => [p.id, p])), [products]);
  const categoriesById = useMemo(() => new Map<string, any>(categories.map((c: any) => [c.id, c])), [categories]);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
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

  // --- Restaurar borrador al montar el componente ---
  const getInitialDraft = () => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; }
  };
  const draft = getInitialDraft();

  const [supplierId, setSupplierId] = useState(draft?.supplierId ?? "");
  const [invoiceNumber, setInvoiceNumber] = useState(draft?.invoiceNumber ?? "");
  const [date, setDate] = useState(draft?.date ?? new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState(draft?.notes ?? "");
  const [discountAmount, setDiscountAmount] = useState<number | "">(draft?.discountAmount ?? "");
  const [discountInput, setDiscountInput] = useState<string>(
    draft?.discountAmount ? Number(draft.discountAmount).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""
  );

  const [items, setItems] = useState(
    draft?.items ?? [{ productId: "", quantity: "" as unknown as number, unitCost: "" as unknown as number, discount: "" as unknown as number, discountInput: "", subtotal: 0 }]
  );

  // --- Guardar borrador en localStorage en cada cambio ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ supplierId, invoiceNumber, date, notes, items, discountAmount }));
    } catch { }
  }, [supplierId, invoiceNumber, date, notes, items]);

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

    const totals = getItemTotals(item, productsById, categoriesById);
    item.subtotal = totals.baseSubtotal;

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { productId: "", quantity: "" as unknown as number, unitCost: "" as unknown as number, discount: "" as unknown as number, discountInput: "", subtotal: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_: any, i: number) => i !== index));
  };

  const handleEditProduct = (productId: string, itemIndex: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setEditingProductId(productId);
    setEditingItemIndex(itemIndex);

    // El costo en BD ya incluye IVA
    const productIva = Number(product.iva) || 0;
    const originalCost = Number(product.unitCost);

    setQuickProductData({
      name: product.name,
      categoryId: product.categoryId || "",
      barCode: product.barCode || "",
      stock: items[itemIndex]?.quantity?.toString() || "",
      unitCost: originalCost.toString(),
      profitPercentage: product.profitPercentage?.toString() || "",
      hasIva: Number(product.iva) > 0,
      iva: Number(product.iva) || 19,
      autoRound: true,
    });
    setIsQuickProductModalOpen(true);
  };

  // El IVA se aplica en el cálculo del precio de venta (useSellingPrice), no en el campo de costo.

  const handleQuickProductCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProduct(true);
    const rawCostValue = typeof quickProductData.unitCost === 'string' ? parseLocalizedNumber(quickProductData.unitCost) : quickProductData.unitCost;
    const costValue = rawCostValue; // El IVA ya se sumó en el onBlur

    const selectedCat = categories.find(c => c.id === quickProductData.categoryId);
    const isInsumos = selectedCat?.name.toLowerCase().includes('insumo') || false;

    const finalUnitCost = costValue;

    if (editingProductId) {
      const result = await updateQuickProductAction(editingProductId, {
        name: quickProductData.name,
        barCode: quickProductData.barCode,
        categoryId: quickProductData.categoryId || undefined,
        stock: undefined,
        unitCost: finalUnitCost,
        salePrice: isInsumos ? 0 : sellingPrice,
        profitPercentage: isInsumos ? 0 : (quickProductData.profitPercentage ? Number(quickProductData.profitPercentage) : undefined),
        iva: quickProductData.hasIva ? quickProductData.iva : 0
      });
      if (result.success && result.data) {
        const updatedProduct = result.data;
        setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p).sort((a, b) => a.name.localeCompare(b.name)));

        setItems(items.map((item: any, idx: number) => {
          if (editingItemIndex !== null && idx === editingItemIndex) {
            const newQuantity = quickProductData.stock ? Number(quickProductData.stock) : Number(item.quantity);
            return {
              ...item,
              quantity: newQuantity as unknown as number,
              unitCost: Number(updatedProduct.unitCost) as unknown as number,
              subtotal: newQuantity * Number(updatedProduct.unitCost)
            };
          }
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
        setEditingItemIndex(null);
        setQuickProductData({
          name: "",
          categoryId: "",
          barCode: "",
          stock: "",
          unitCost: "",
          profitPercentage: "",
          hasIva: true,
          iva: 19,
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
        unitCost: finalUnitCost,
        salePrice: isInsumos ? 0 : sellingPrice,
        profitPercentage: isInsumos ? 0 : (quickProductData.profitPercentage ? Number(quickProductData.profitPercentage) : undefined),
        iva: quickProductData.hasIva ? quickProductData.iva : 0
      });

      // Conflicto de código de barras: preguntar si sobreescribir
      if (!result.success && (result as any).conflict && (result as any).existingProduct) {
        const existing = (result as any).existingProduct;
        const confirmed = window.confirm(
          `⚠️ Este producto ya existe:\n\n"${existing.name}"\n\n¿Seguro que quieres aplicar los cambios a este producto?`
        );
        if (confirmed) {
          setIsCreatingProduct(true);
          const updateResult = await updateQuickProductAction(existing.id, {
            name: quickProductData.name,
            barCode: quickProductData.barCode,
            categoryId: quickProductData.categoryId || undefined,
            unitCost: finalUnitCost,
            salePrice: isInsumos ? 0 : sellingPrice,
            profitPercentage: isInsumos ? 0 : (quickProductData.profitPercentage ? Number(quickProductData.profitPercentage) : undefined),
            iva: quickProductData.hasIva ? quickProductData.iva : 0
          });
          if (updateResult.success && updateResult.data) {
            const updatedProduct = updateResult.data;
            // Si ya estaba en la lista de productos, actualizarlo; si no, agregarlo
            setProducts(prev => {
              const exists = prev.find(p => p.id === updatedProduct.id);
              if (exists) return prev.map(p => p.id === updatedProduct.id ? updatedProduct : p).sort((a, b) => a.name.localeCompare(b.name));
              return [...prev, updatedProduct].sort((a, b) => a.name.localeCompare(b.name));
            });
            const newItems = [...items];
            const emptyRowIndex = newItems.findIndex(i => !i.productId);
            const productQuantity = quickProductData.stock ? Number(quickProductData.stock) : 1;
            const unitCostNumber = Number(updatedProduct.unitCost);
            if (emptyRowIndex >= 0) {
              newItems[emptyRowIndex] = { productId: updatedProduct.id, quantity: productQuantity as unknown as number, unitCost: unitCostNumber as unknown as number, discount: "" as unknown as number, discountInput: "", subtotal: productQuantity * unitCostNumber };
            } else {
              newItems.push({ productId: updatedProduct.id, quantity: productQuantity as unknown as number, unitCost: unitCostNumber as unknown as number, discount: "" as unknown as number, discountInput: "", subtotal: productQuantity * unitCostNumber });
            }
            setItems(newItems);
            setIsQuickProductModalOpen(false);
            setQuickProductData({ name: "", categoryId: "", barCode: "", stock: "", unitCost: "", profitPercentage: "", hasIva: true, iva: 19, autoRound: true });
          } else {
            setError(updateResult.error || "Ocurrió un error actualizando el producto.");
          }
        }
        setIsCreatingProduct(false);
        return;
      }

      if (result.success && result.data) {
        const newProduct = result.data;
        setProducts([...products, newProduct].sort((a, b) => a.name.localeCompare(b.name)));

        const newItems = [...items];
        const emptyRowIndex = newItems.findIndex(i => !i.productId);
        const productQuantity = quickProductData.stock ? Number(quickProductData.stock) : 1;
        const unitCostNumber = Number(newProduct.unitCost);

        if (emptyRowIndex >= 0) {
          newItems[emptyRowIndex] = {
            productId: newProduct.id,
            quantity: productQuantity as unknown as number,
            unitCost: unitCostNumber as unknown as number,
            discount: "" as unknown as number,
            discountInput: "",
            subtotal: productQuantity * unitCostNumber
          };
        } else {
          newItems.push({
            productId: newProduct.id,
            quantity: productQuantity as unknown as number,
            unitCost: unitCostNumber as unknown as number,
            discount: "" as unknown as number,
            discountInput: "",
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
          hasIva: true,
          iva: 19,
          autoRound: true,
        });
      } else {
        setError(result.error || "Ocurrió un error creando el producto.");
      }
    }
    setIsCreatingProduct(false);
  };

  const sumItemDiscounts = useMemo(() => {
    return items.reduce((acc: number, item: any) => {
      const d = Number(item.discount || 0);
      return acc + (isNaN(d) ? 0 : d);
    }, 0);
  }, [items]);

  const isGlobalDiscountLocked = sumItemDiscounts > 0;
  const isItemDiscountLocked = !isGlobalDiscountLocked && Number(discountAmount) > 0;

  useEffect(() => {
    if (sumItemDiscounts > 0 && discountInput !== "") {
      setDiscountInput("");
      setDiscountAmount("");
    }
  }, [sumItemDiscounts]); // eslint-disable-line react-hooks/exhaustive-deps

  const { subtotal, ivaAmount, grandTotal, grossSubtotal } = useMemo(() => {
    const globalDiscount = isGlobalDiscountLocked ? sumItemDiscounts : (discountAmount !== "" ? Number(discountAmount) : 0);
    return calculateInvoiceTotals(items, products, categories, globalDiscount);
  }, [items, products, categories, discountAmount, isGlobalDiscountLocked, sumItemDiscounts]);

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

    const result = await createPurchaseInvoiceAction({
      supplierId,
      invoiceNumber,
      date: new Date(date),
      subtotal,
      discountAmount: discountAmount !== "" ? Number(discountAmount) : undefined,
      ivaAmount,
      grandTotal,
      adminId,
      notes,
      items: items.map((item: any) => {
        const totals = getItemTotals(item, productsById, categoriesById);
        return {
          productId: item.productId,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          subtotal: totals.gross,
          discountAmount: item.discount !== "" ? Number(item.discount) : undefined,
          netSubtotal: totals.baseSubtotal
        };
      })
    });

    if (result.success) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_KEY);
      }
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

          <div className="flex flex-col gap-3 overflow-x-auto pb-2">
            {items.map((item: any, index: number) => {
              const itemTotals = getItemTotals(item, productsById, categoriesById);
              return (
                <div key={index} className="flex gap-4 items-center bg-surface p-4 rounded-2xl border border-outline-variant flex-wrap md:flex-nowrap md:min-w-max">
                  <div className="w-full md:w-80 shrink-0 min-w-0">
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
                          onClick={() => handleEditProduct(item.productId, index)}
                          className="p-2 text-primary hover:bg-primary-container/20 rounded-lg shrink-0 cursor-pointer"
                          title="Editar producto"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-24 shrink-0">
                    <label className="text-[10px] text-secondary uppercase block mb-1">Cant</label>
                    <input
                      type="number" min="1" step="1" required placeholder="0"
                      className="w-full bg-surface-container p-2 rounded-lg border border-outline-variant text-center focus:border-primary"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value ? Number(e.target.value) : "")}
                    />
                  </div>

                  <div className="w-32 shrink-0">
                    <label className="text-[10px] text-secondary uppercase block mb-1">Costo Unit</label>
                    <input
                      type="number" min="0" step="any" required placeholder="0"
                      className="w-full bg-surface-container-highest p-2 rounded-lg border border-outline-variant text-right cursor-not-allowed opacity-80"
                      value={item.unitCost}
                      readOnly
                    />
                  </div>

                  <div className="w-32 shrink-0">
                    <label className="text-[10px] text-secondary uppercase block mb-1">Descuento</label>
                    <input
                      type="text" placeholder="0"
                      disabled={isItemDiscountLocked}
                      className={`w-full p-2 rounded-lg border text-right focus:border-primary ${isItemDiscountLocked ? 'bg-surface-container-highest border-outline-variant/50 cursor-not-allowed opacity-60' : 'bg-surface-container border-outline-variant'}`}
                      value={item.discountInput || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!/^[0-9.,]*$/.test(val)) return;
                        const newItems = [...items];
                        newItems[index].discountInput = val;
                        newItems[index].discount = parseLocalizedNumber(val) || "";
                        const totals = getItemTotals(newItems[index], productsById, categoriesById);
                        newItems[index].subtotal = totals.baseSubtotal;
                        setItems(newItems);
                      }}
                      onBlur={() => {
                        const newItems = [...items];
                        const num = parseLocalizedNumber(newItems[index].discountInput || "");
                        if (num > 0) {
                          newItems[index].discountInput = num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          newItems[index].discount = num;
                        } else {
                          newItems[index].discountInput = "";
                          newItems[index].discount = "";
                        }
                        const totals = getItemTotals(newItems[index], productsById, categoriesById);
                        newItems[index].subtotal = totals.baseSubtotal;
                        setItems(newItems);
                      }}
                    />
                  </div>

                  <div className="w-36 shrink-0 text-right">
                    <label className="text-[10px] text-secondary uppercase block mb-1">Subtotal</label>
                    <div className="font-medium p-1 text-on-surface">
                      ${itemTotals.gross.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="w-36 shrink-0 text-right">
                    <label className="text-[10px] text-secondary uppercase block mb-1">Subtotal Neto</label>
                    <div className="font-medium p-1 text-on-surface text-primary">
                      ${itemTotals.baseSubtotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="w-32 shrink-0 text-right">
                    <label className="text-[10px] text-secondary uppercase block mb-1">Total IVA</label>
                    <div className="font-medium p-1 text-on-surface text-primary">
                      ${itemTotals.ivaAmount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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
              );
            })}
          </div>
        </div>

        {/* Totales y Submit */}
        <div className="flex flex-col md:flex-row justify-between items-end bg-surface p-6 rounded-2xl border border-outline-variant mt-4 gap-6">
          <div className="flex flex-col gap-4 w-full md:w-auto">
            <div className="flex flex-col w-full md:w-64">
              <label className="text-[10px] text-secondary uppercase font-medium mb-1">Descuento Global</label>
              <span className="text-[12px] text-secondary/70 mb-1 leading-tight">
                {isGlobalDiscountLocked
                  ? "(Bloqueado: sumando descuentos de productos)"
                  : "(Bloqueado si usas descuentos por producto)"}
              </span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">$</span>
                <input
                  type="text"
                  placeholder="0"
                  disabled={isGlobalDiscountLocked}
                  className={`w-full p-2 pl-7 rounded-lg border focus:border-primary text-body-md transition-colors ${isGlobalDiscountLocked ? 'bg-surface-container-highest border-outline-variant/50 cursor-not-allowed opacity-80 text-primary font-medium' : 'bg-surface-container-highest border-outline-variant'}`}
                  value={isGlobalDiscountLocked ? sumItemDiscounts.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : discountInput}
                  onChange={(e) => {
                    if (isGlobalDiscountLocked) return;
                    const val = e.target.value;
                    if (!/^[0-9.,]*$/.test(val)) return;
                    setDiscountInput(val);
                    setDiscountAmount(parseLocalizedNumber(val) || "");
                  }}
                  onBlur={() => {
                    if (isGlobalDiscountLocked) return;
                    const num = parseLocalizedNumber(discountInput);
                    if (num > 0) {
                      setDiscountInput(num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                      setDiscountAmount(num);
                    } else {
                      setDiscountInput("");
                      setDiscountAmount("");
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col border-t border-outline-variant pt-3 gap-2">
              <div className="flex justify-between items-center text-secondary">
                <span className="text-body-sm">Subtotal:</span>
                <span className="font-medium">
                  ${grossSubtotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-secondary">
                <span className="text-body-sm">Subtotal (Neto):</span>
                <span className="font-medium text-on-surface">
                  ${subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-secondary">
                <span className="text-body-sm">Total IVA:</span>
                <span className="font-medium">
                  ${ivaAmount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex flex-col mt-1">
                <span className="text-secondary text-body-sm">Total Factura (Antes de guardar)</span>
                <span className="text-headline-md text-primary font-bold">
                  ${grandTotal.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
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
              <h2 className="text-headline-sm font-bold">
                {editingProductId ? "Editar Producto" : "Creación Rápida"}
              </h2>
              <button type="button" onClick={() => { setIsQuickProductModalOpen(false); setEditingProductId(null); setEditingItemIndex(null); }} className="text-secondary hover:text-on-surface">
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
                <div>
                  <label className="block text-body-sm text-secondary mb-1">Cantidad a Comprar</label>
                  <input
                    type="number" min="1" step="1" placeholder="1"
                    required
                    className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
                    value={quickProductData.stock}
                    onChange={(e) => setQuickProductData({ ...quickProductData, stock: e.target.value })}
                  />
                </div>
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
              <div className="mb-4">
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
                            readOnly
                            type="number" min="0" step="any" placeholder="15"
                            className="w-full bg-surface-container-highest p-3 rounded-xl border border-outline-variant focus:outline-none cursor-not-allowed opacity-80"
                            value={quickProductData.profitPercentage}
                          />
                        </div>
                      )}
                      <div className={isInsumos ? "col-span-2" : ""}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-body-sm text-secondary">IVA [%]</label>
                          <label className="flex items-center gap-1 cursor-pointer text-[10px] text-secondary">
                            <input
                              type="checkbox"
                              checked={quickProductData.hasIva}
                              disabled
                              className="w-3 h-3 cursor-not-allowed"
                            />
                            Incluir
                          </label>
                        </div>
                        <input
                          readOnly
                          type="number" min="0" step="any"
                          className="w-full bg-surface-container-highest p-3 rounded-xl border border-outline-variant focus:outline-none cursor-not-allowed opacity-80"
                          value={quickProductData.iva}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-body-sm text-secondary">
                          {isInsumos ? "Costo Total (con IVA) *" : "Precio de Venta (Público) *"}
                        </label>
                        {!isInsumos && (
                          <label className="flex items-center gap-1 cursor-pointer text-[10px] text-secondary">
                            <input
                              type="checkbox"
                              checked={quickProductData.autoRound}
                              disabled
                              className="w-3 h-3 cursor-not-allowed"
                            />
                            Redondear a $50
                          </label>
                        )}
                      </div>
                      <input
                        readOnly
                        type="text"
                        className="w-full bg-surface-container-highest p-3 rounded-xl border border-outline-variant text-on-surface-variant cursor-not-allowed"
                        value={formattedSellingPrice}
                      />
                    </div>
                  </>
                );
              })()}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickProductModalOpen(false);
                    setEditingProductId(null);
                    setEditingItemIndex(null);
                  }}
                  className="px-6 py-2 rounded-full border border-outline-variant text-secondary hover:bg-surface-container"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="px-6 py-2 rounded-full bg-primary-fixed text-black hover:brightness-95 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isCreatingProduct ? "Guardando..." : (editingProductId ? "Guardar Cambios" : "Crear y Añadir")}
                </button>
              </div>
            </form>
          </div>
        </div >
      )
      }

      {
        isQuickSupplierModalOpen && (
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
        )
      }

      {
        isPreviewModalOpen && (
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
                        const itemTotals = getItemTotals(item, productsById, categoriesById);
                        return (
                          <div key={idx} className="flex justify-between items-center p-2 border-b border-outline-variant/30 last:border-0 text-body-sm">
                            <div className="truncate pr-2 w-1/2">
                              {item.quantity}x {p?.name || 'Desconocido'}
                            </div>
                            <div className="font-medium">
                              ${itemTotals.totalSubtotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-primary-container/20 rounded-xl p-4 flex flex-col gap-1 text-right">
                  <div className="flex justify-between text-secondary">
                    <span>Subtotal (Base):</span>
                    <span>${subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                  </div>
                  {ivaAmount > 0 && (
                    <div className="flex justify-between text-secondary">
                      <span>IVA Total:</span>
                      <span>${ivaAmount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-headline-sm font-bold text-primary mt-2 pt-2 border-t border-outline-variant/50">
                    <span>Total Factura:</span>
                    <span>${grandTotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
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
        )
      }
    </div >
  );
}
