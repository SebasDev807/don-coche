export interface Product {
  id: string;
  categoryId?: string;
  iva?: number | string | null; // Porcentaje de IVA (19 = 19%). Si falta, se usa el IVA por defecto
}

export interface Category {
  id: string;
  name?: string;
}

export interface InvoiceItem {
  productId?: string;
  quantity: number | string;
  unitCost: number | string;    // Precio unitario SIN IVA
  discount?: number | string;   // Descuento total de la línea (no por unidad), por defecto 0
}

export interface ItemTotals {
  qty: number;
  cost: number;
  discount: number;
  hasDiscountError?: boolean;
  netUnitPrice: number;   // Precio unitario sin IVA
  ivaRate: number;        // Porcentaje de IVA aplicado
  unitWithIva: number;    // Precio unitario con IVA
  gross: number;          // (cantidad × precio unitario) sin descuento
  baseSubtotal: number;   // (cantidad × precio unitario) − descuento
  ivaAmount: number;      // IVA de la línea, calculado sobre baseSubtotal
  totalSubtotal: number;  // baseSubtotal + ivaAmount
  isInsumo: boolean;
}

export interface InvoiceTotals {
  subtotal: number;       // Suma de bases (ya netas de descuento)
  totalDiscount: number;  // Suma de descuentos
  ivaAmount: number;      // Suma del IVA de cada línea
  grandTotal: number;     // subtotal + ivaAmount
}

const DEFAULT_IVA_RATE = 19;

// Redondea a 2 decimales para evitar errores de punto flotante
const roundTo2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

function parseNumber(value: number | string | null | undefined, field: string): number {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number in "${field}": ${String(value)}`);
  }
  return parsed;
}

export function getItemTotals(
  item: InvoiceItem,
  productsById: Map<string, Product>,
  categoriesById: Map<string, Category>
): ItemTotals {
  const qty = parseNumber(item.quantity, "quantity");
  const cost = parseNumber(item.unitCost, "unitCost");
  const discount = parseNumber(item.discount, "discount"); // Por defecto 0

  if (qty < 0 || cost < 0 || discount < 0) {
    throw new Error("Values cannot be negative");
  }

  const prod = item.productId ? productsById.get(item.productId) : undefined;
  if (!prod) {
    const gross = cost * qty;
    const baseSubtotal = roundTo2(gross - discount);
    return {
      qty,
      cost,
      discount: roundTo2(discount),
      netUnitPrice: cost,
      ivaRate: 0,
      unitWithIva: cost,
      gross: roundTo2(gross),
      baseSubtotal,
      ivaAmount: 0,
      totalSubtotal: baseSubtotal,
      isInsumo: false,
    };
  }

  const category = prod.categoryId ? categoriesById.get(prod.categoryId) : undefined;
  const isInsumo = category?.name?.toLowerCase().includes("insumo") ?? false;

  const ivaRate =
    prod.iva === undefined || prod.iva === null || prod.iva === ""
      ? 0 // "si lo tiene"
      : parseNumber(prod.iva, "product.iva");

  if (ivaRate < 0) {
    throw new Error(`Invalid IVA rate for product ${prod.id}`);
  }

  const gross = cost * qty;

  let effectiveDiscount = discount;
  if (discount > gross) {
    effectiveDiscount = gross; // Prevent crashing the UI by capping the discount
  }

  const baseSubtotal = roundTo2(gross - effectiveDiscount);

  // Sacar IVA al subtotal neto
  const ivaAmount = roundTo2(baseSubtotal * (ivaRate / 100));
  const totalSubtotal = roundTo2(baseSubtotal + ivaAmount);

  return {
    qty,
    cost,
    discount: roundTo2(effectiveDiscount),
    hasDiscountError: discount > gross,
    netUnitPrice: cost,
    ivaRate,
    unitWithIva: roundTo2(cost * (1 + ivaRate / 100)),
    gross: roundTo2(gross),
    baseSubtotal,
    ivaAmount,
    totalSubtotal,
    isInsumo,
  };
}

export function calculateInvoiceTotals(
  items: InvoiceItem[],
  products: Product[],
  categories: Category[],
  globalDiscount: number = 0
): InvoiceTotals & { subtotalBeforeIva: number, grossSubtotal: number, hasDiscountError: boolean } {
  const productsById = new Map(products.map((p) => [p.id, p]));
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  let subtotal = 0; // Gross subtotal (precio * cantidad)
  let ivaAmount = 0;
  let hasDiscountError = false;

  for (const item of items) {
    if (!item.productId) continue;

    const totals = getItemTotals(item, productsById, categoriesById);
    if (totals.hasDiscountError) {
      hasDiscountError = true;
    }
    const qty = totals.qty;
    const cost = totals.cost;
    subtotal += (qty * cost);
    ivaAmount += totals.ivaAmount;
  }

  const subtotalBeforeIva = subtotal - globalDiscount;
  const grandTotal = subtotalBeforeIva + ivaAmount;

  return {
    grossSubtotal: roundTo2(subtotal),
    subtotal: roundTo2(subtotalBeforeIva),
    totalDiscount: roundTo2(globalDiscount),
    subtotalBeforeIva: roundTo2(subtotalBeforeIva),
    ivaAmount: roundTo2(ivaAmount),
    grandTotal: roundTo2(grandTotal),
    hasDiscountError: hasDiscountError || (globalDiscount > subtotal),
  };
}