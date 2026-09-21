'use client';

import { useState, useCallback, useRef } from 'react';
import { PaymentMethod, ItemCategory } from '@prisma/client';
import { AlmacenProduct } from '@/actions/almacen/almacen.actions';
import { ProductGrid } from './ProductGrid';
import { SaleCart } from './SaleCart';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { getServicesByCategory, createAndBillServiceOrder, createServiceOrderForCaja } from '@/actions/almacen/servicios.actions';
import { ServiceOrderReceiptModal } from './ServiceOrderReceiptModal';
import { useEffect } from 'react';

const MySwal = withReactContent(Swal);

interface AlmacenClientProps {
  initialProducts: AlmacenProduct[];
  hideServicesTab?: boolean;
  prefillData?: {
    plate?: string;
    customerName?: string;
    customerCc?: string;
    customerPhone?: string;
  };
}

const SERVICE_CATEGORIES: {
  category: ItemCategory;
  label: string;
  icon: string;
  description: string;
  color: string;
  bg: string;
}[] = [
    {
      category: 'SERVITECA',
      label: 'Serviteca',
      icon: 'settings',
      description: 'Cambios de aceite, frenos, suspensión y más',
      color: '#2563eb',
      bg: '#eff6ff',
    },
    {
      category: 'LAVADERO',
      label: 'Lavadero',
      icon: 'local_car_wash',
      description: 'Lavado exterior, interior, encerado y detailing',
      color: '#0891b2',
      bg: '#ecfeff',
    },
  ];

export function AlmacenClient({ initialProducts, hideServicesTab = false, prefillData }: AlmacenClientProps) {
  const [activeTab, setActiveTab] = useState<'productos' | 'servicios'>('productos');
  const [products] = useState<AlmacenProduct[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [customerName, setCustomerName] = useState(prefillData?.customerName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [sentToCajaOrderNumber, setSentToCajaOrderNumber] = useState<number | null>(null);

  // Servicios
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [servicesSearch, setServicesSearch] = useState('');
  const [visibleServicesCount, setVisibleServicesCount] = useState(24);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hideServicesTab) {
      getServicesByCategory().then((res) => {
        if (res.success) setServices(res.data);
      });
    }
  }, [hideServicesTab]);

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(servicesSearch.toLowerCase())
  );

  useEffect(() => {
    setVisibleServicesCount(24);
  }, [servicesSearch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleServicesCount((prev) => Math.min(prev + 24, filteredServices.length));
        }
      },
      { rootMargin: '100px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    const currentTarget = observerTarget.current;
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [filteredServices.length]);

  const toggleService = useCallback((id: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const addToCart = useCallback((product: AlmacenProduct) => {
    setCart((prev) => {
      const next = new Map(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
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

  const removeFromCart = useCallback((id: string, type: 'PRODUCT' | 'SERVICE') => {
    if (type === 'PRODUCT') {
      setCart((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    } else {
      setSelectedServiceIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const handleSell = async (emitirFactura: boolean, vehicleData?: any) => {
    if (cart.size === 0 && selectedServiceIds.size === 0) return;

    const hasServices = selectedServiceIds.size > 0;
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

    const res = await createAndBillServiceOrder({
      plate: vehicleData?.plate,
      customerName: customerName.trim() || undefined,
      customerCc: vehicleData?.customerCc?.trim() || undefined,
      customerPhone: vehicleData?.customerPhone?.trim() || undefined,
      serviceIds: Array.from(selectedServiceIds),
      productItems: items,
      paymentMethod,
      emitirFactura,
    });

    setIsSubmitting(false);
    MySwal.close();

    if (res.success) {
      setCart(new Map());
      setSelectedServiceIds(new Set());
      setCustomerName('');
      setCompletedOrder(res.data);
    } else {
      MySwal.fire('Error', res.message, 'error');
    }
  };

  /** Enviar los servicios seleccionados a caja (orden EN_PISTA) sin facturar */
  const handleSendToCaja = async (vehicleData?: any) => {
    if (selectedServiceIds.size === 0 && cart.size === 0) return;

    const items = Array.from(cart.entries()).map(([productId, quantity]) => ({ productId, quantity }));

    const result = await MySwal.fire({
      title: 'Enviar a Caja',
      text: '¿Deseas enviar esta orden a la cola de caja para que el cajero procese el pago?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Enviar a Caja',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    MySwal.showLoading();

    const res = await createServiceOrderForCaja({
      plate: vehicleData?.plate || '',
      customerName: customerName.trim() || undefined,
      customerCc: vehicleData?.customerCc?.trim() || undefined,
      customerPhone: vehicleData?.customerPhone?.trim() || undefined,
      serviceIds: Array.from(selectedServiceIds),
      productItems: items.length > 0 ? items : undefined,
    });

    setIsSubmitting(false);
    MySwal.close();

    if (res.success) {
      setCart(new Map());
      setSelectedServiceIds(new Set());
      setCustomerName('');
      setSentToCajaOrderNumber(res.data?.orderNumber ?? null);
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: res.message || 'Enviado a caja',
        showConfirmButton: false,
        timer: 3500,
      });
    } else {
      MySwal.fire('Error', res.message, 'error');
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* ── Tabs Navigation ── */}
      {!hideServicesTab && (
        <div className="flex bg-surface-container-low p-1 rounded-2xl w-full sm:w-96 mx-auto mb-2 border border-outline-variant shadow-sm">
          <button
            onClick={() => setActiveTab('productos')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${activeTab === 'productos'
              ? 'bg-primary text-on-primary shadow-md'
              : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            Productos
          </button>
          <button
            onClick={() => setActiveTab('servicios')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${activeTab === 'servicios'
              ? 'bg-primary text-on-primary shadow-md'
              : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">build_circle</span>
            Servicios
          </button>
        </div>
      )}

      {/* ── Contenido de la pestaña "Productos" ── */}
      {activeTab === 'productos' && (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 fade-in">
          {/* Columna izquierda: Catálogo */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface leading-tight">Punto de Venta</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Venta directa de productos e insumos
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
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
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
              selectedServiceIds={selectedServiceIds}
              services={services}
              paymentMethod={paymentMethod}
              onPaymentChange={setPaymentMethod}
              onChangeQty={changeQty}
              onRemove={removeFromCart}
              onSell={handleSell}
              onSendToCaja={(vehicleData) => handleSendToCaja(vehicleData)}
              isSubmitting={isSubmitting}
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
            />
          </div>
        </div>
      )}

      {/* ── Contenido de la pestaña "Servicios" ── */}
      {activeTab === 'servicios' && (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 fade-in">
          {/* Columna izquierda: Catálogo de Servicios */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface leading-tight">Servicios</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Agrega servicios al carrito
                </p>
              </div>
              <div className="sm:ml-auto relative w-full sm:w-72">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
                <input
                  type="text"
                  value={servicesSearch}
                  onChange={(e) => setServicesSearch(e.target.value)}
                  placeholder="Buscar servicio..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Lista de servicios */}
            <div className="flex-1 overflow-y-auto pr-1 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredServices.slice(0, visibleServicesCount).map((s) => {
                  const isSelected = selectedServiceIds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      className={`group flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left
                        ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-outline-variant bg-surface hover:border-primary/50'}`}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-surface-container">
                        <span className="material-symbols-outlined text-primary text-[20px]">
                          {s.category === 'LAVADERO' ? 'local_car_wash' : 'settings'}
                        </span>
                      </div>
                      <div className="flex-1 min-h-0 w-full">
                        <h3 className="font-bold text-sm text-on-surface leading-tight mb-1">{s.name}</h3>
                        <p className="text-xs text-on-surface-variant font-medium">${s.pvp.toLocaleString('es-CO')}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-4 right-4 text-primary bg-surface rounded-full">
                          <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Observador para cargar más servicios */}
              {visibleServicesCount < filteredServices.length && (
                <div ref={observerTarget} className="h-10 w-full flex items-center justify-center mt-4">
                  <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Carrito (compartido) */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:h-full">
            <SaleCart
              cart={cart}
              products={products}
              selectedServiceIds={selectedServiceIds}
              services={services}
              paymentMethod={paymentMethod}
              onPaymentChange={setPaymentMethod}
              onChangeQty={changeQty}
              onRemove={removeFromCart}
              onSell={handleSell}
              onSendToCaja={(vehicleData) => handleSendToCaja(vehicleData)}
              isSubmitting={isSubmitting}
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
            />
          </div>
        </div>
      )}

      {/* Modal de recibo post-venta combinada/servicios */}
      {completedOrder && (
        <ServiceOrderReceiptModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
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
