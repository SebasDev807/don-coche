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
  netUnitPrice: number;   // Precio unitario sin IVA
  ivaRate: number;        // Porcentaje de IVA aplicado
  unitWithIva: number;    // Precio unitario con IVA
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
    throw new Error(`Product not found: ${item.productId ?? "(no id)"}`);
  }

  const category = prod.categoryId ? categoriesById.get(prod.categoryId) : undefined;
  const isInsumo = category?.name?.toLowerCase().includes("insumo") ?? false;

  const ivaRate =
    prod.iva === undefined || prod.iva === null || prod.iva === ""
      ? DEFAULT_IVA_RATE
      : parseNumber(prod.iva, "product.iva");

  if (ivaRate < 0) {
    throw new Error(`Invalid IVA rate for product ${prod.id}`);
  }

  const gross = cost * qty;

  if (discount > gross) {
    throw new Error(`Discount cannot exceed the gross value (product ${prod.id})`);
  }

  const baseSubtotal = roundTo2(gross - discount);

  const ivaAmount = roundTo2(baseSubtotal * (ivaRate / 100));
  const totalSubtotal = roundTo2(baseSubtotal + ivaAmount);

  return {
    qty,
    cost,
    discount: roundTo2(discount),
    netUnitPrice: cost,
    ivaRate,
    unitWithIva: roundTo2(cost * (1 + ivaRate / 100)),
    baseSubtotal,
    ivaAmount,
    totalSubtotal,
    isInsumo,
  };
}

export function calculateInvoiceTotals(
  items: InvoiceItem[],
  products: Product[],
  categories: Category[]
): InvoiceTotals {
  const productsById = new Map(products.map((p) => [p.id, p]));
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  let subtotal = 0;
  let totalDiscount = 0;
  let ivaAmount = 0;
  let grandTotal = 0;

  for (const item of items) {
    if (!item.productId) continue;

    const totals = getItemTotals(item, productsById, categoriesById);
    subtotal += totals.baseSubtotal;
    totalDiscount += totals.discount;
    ivaAmount += totals.ivaAmount;
    grandTotal += totals.totalSubtotal;
  }

  return {
    subtotal: roundTo2(subtotal),
    totalDiscount: roundTo2(totalDiscount),
    ivaAmount: roundTo2(ivaAmount),
    grandTotal: roundTo2(grandTotal),
  };
}