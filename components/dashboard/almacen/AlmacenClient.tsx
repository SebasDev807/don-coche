'use client';

import { useState, useCallback } from 'react';
import { PaymentMethod } from '@prisma/client';
import { AlmacenProduct, createProductSale } from '@/actions/almacen/almacen.actions';
import { ProductGrid } from './ProductGrid';
import { SaleCart } from './SaleCart';
import { SaleReceiptModal } from './SaleReceiptModal';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface AlmacenClientProps {
  initialProducts: AlmacenProduct[];
}

export function AlmacenClient({ initialProducts }: AlmacenClientProps) {
  const [products] = useState<AlmacenProduct[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);

  const addToCart = useCallback((product: AlmacenProduct) => {
    setCart((prev) => {
      const next = new Map(prev);
      if (next.has(product.id)) {
        // Ya está en el carrito → deseleccionar
        next.delete(product.id);
      } else {
        // No está → agregar con cantidad 1
        next.set(product.id, 1);
      }
      return next;
    });
  }, []);

  const changeQty = useCallback((productId: string, delta: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const current = next.get(productId) ?? 0;
      const newQty = current + delta;
      if (newQty <= 0) {
        next.delete(productId);
      } else {
        const product = products.find((p) => p.id === productId);
        if (product && newQty <= product.stock) {
          next.set(productId, newQty);
        }
      }
      return next;
    });
  }, [products]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  }, []);

  const handleSell = async (emitirFactura: boolean) => {
    if (cart.size === 0) return;

    const items = Array.from(cart.entries()).map(([productId, quantity]) => ({ productId, quantity }));

    const actionLabel = emitirFactura ? 'Factura Electrónica DIAN' : 'Recibo POS';
    const result = await MySwal.fire({
      title: emitirFactura ? 'Emitir Factura Electrónica' : 'Confirmar Venta POS',
      text: `¿Deseas registrar esta venta con ${PAYMENT_LABELS[paymentMethod]} como ${actionLabel}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: emitirFactura ? 'Sí, Emitir Factura' : 'Sí, Generar Recibo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: emitirFactura ? '#3085d6' : '#475569',
    });

    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    MySwal.showLoading();

    const res = await createProductSale({
      items,
      paymentMethod,
      emitirFactura,
      customerName: customerName.trim() || undefined,
    });

    setIsSubmitting(false);
    MySwal.close();

    if (res.success) {
      setCart(new Map());
      setCustomerName('');
      setCompletedSale(res.data);
    } else {
      MySwal.fire('Error', res.message, 'error');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Columna izquierda: Catálogo */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Almacén</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Venta directa de productos — selecciona ítems y factura al instante.
            </p>
          </div>
          <div className="sm:ml-auto relative w-full sm:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
            <input
              id="almacen-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto o código..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto pr-1 pb-4">
          <ProductGrid
            products={products}
            search={search}
            cart={cart}
            onAdd={addToCart}
          />
        </div>
      </div>

      {/* Columna derecha: Carrito */}
      <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:h-full">
        <SaleCart
          cart={cart}
          products={products}
          paymentMethod={paymentMethod}
          onPaymentChange={setPaymentMethod}
          onChangeQty={changeQty}
          onRemove={removeFromCart}
          onSell={handleSell}
          isSubmitting={isSubmitting}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
        />
      </div>

      {/* Modal de recibo post-venta */}
      {completedSale && (
        <SaleReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
}

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
};
