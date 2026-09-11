'use client';

import { AlmacenProduct } from '@/actions/almacen/almacen.actions';

interface ProductGridProps {
  products: AlmacenProduct[];
  search: string;
  cart: Map<string, number>;
  onAdd: (product: AlmacenProduct) => void;
}

export function ProductGrid({ products, search, cart, onAdd }: ProductGridProps) {
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barCode && p.barCode.includes(search))
  );

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl mb-3">search_off</span>
        <p className="font-medium">Sin resultados para &ldquo;{search}&rdquo;</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {filtered.map((product) => {
        const qty = cart.get(product.id) ?? 0;
        const isSelected = qty > 0;
        const isFull = qty >= product.stock && !isSelected;

        return (
          <button
            key={product.id}
            onClick={() => onAdd(product)}
            className={`
              group relative text-left rounded-xl border p-4 transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer active:scale-[0.98]
              ${
                isSelected
                  ? 'border-primary bg-primary/8 shadow-md ring-1 ring-primary/30'
                  : 'border-outline-variant bg-surface-container-lowest hover:border-primary hover:bg-primary/5 hover:shadow-md'
              }
            `}
          >
            {/* Badge stock */}
            <span
              className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full ${
                product.stock <= 5
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {product.stock} uds
            </span>

            {/* Badge IVA — siempre visible */}
            <span className="absolute top-3 left-3 text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container">
              IVA {product.iva}%
            </span>

            <div className="mt-4">
              <p className="font-bold text-sm text-on-surface line-clamp-2 leading-snug mb-1">
                {product.name}
              </p>
              {product.category && (
                <p className="text-[11px] text-on-surface-variant uppercase tracking-wide mb-2">
                  {product.category}
                </p>
              )}
              <p className="font-black text-lg text-primary">
                ${product.salePrice.toLocaleString('es-CO')}
              </p>
              {product.iva > 0 && (
                <p className="text-[11px] text-on-surface-variant">
                  + IVA → ${Math.round(product.salePrice * (1 + product.iva / 100)).toLocaleString('es-CO')} final
                </p>
              )}
            </div>

            {/* Badge cantidad en carrito */}
            {isSelected && (
              <div className="absolute bottom-3 right-3 bg-primary text-on-primary text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                {qty}
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10">
              <span className="material-symbols-outlined text-primary text-3xl">
                {isSelected ? 'remove_shopping_cart' : 'add_shopping_cart'}
              </span>
            </div>
          </button>
        );

      })}
    </div>
  );
}
