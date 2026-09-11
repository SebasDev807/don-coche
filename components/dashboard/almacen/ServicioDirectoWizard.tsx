'use client';

import { useState, useCallback } from 'react';
import { ItemCategory, PaymentMethod } from '@prisma/client';
import { CustomerSearchBar, type CustomerSuggestion, type VehicleInfo } from '@/components/tecnico/CustomerSearchBar';
import { VehicleSelector } from '@/components/tecnico/VehicleSelector';
import { searchVehicleByPlate, getServicesByCategory, createAndBillServiceOrder } from '@/actions/almacen/servicios.actions';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ServiceOrderReceiptModal } from './ServiceOrderReceiptModal';

const MySwal = withReactContent(Swal);

interface Service {
  id: string;
  name: string;
  pvp: number;
}

type Step = 'vehicle' | 'services' | 'payment';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: 'payments' },
  { value: 'TARJETA', label: 'Tarjeta', icon: 'credit_card' },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: 'account_balance' },
];

const CATEGORY_META: Partial<Record<ItemCategory, { label: string; icon: string; color: string }>> = {
  SERVITECA: { label: 'Serviteca', icon: 'settings', color: '#2563eb' },
  LAVADERO: { label: 'Lavadero', icon: 'local_car_wash', color: '#0891b2' },
};

interface ServicioDirectoWizardProps {
  category?: ItemCategory;
  onClose?: () => void;
  inline?: boolean;
}

export function ServicioDirectoWizard({ category, onClose, inline = false }: ServicioDirectoWizardProps) {
  const meta = category ? (CATEGORY_META[category] || { label: 'Servicio', icon: 'build', color: '#6b7280' }) : { label: 'Todos los Servicios', icon: 'build', color: '#6b7280' };

  const [step, setStep] = useState<Step>('vehicle');
  const [isLoading, setIsLoading] = useState(false);

  // Paso 1
  const [plate, setPlate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCc, setCustomerCc] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [vehicleFound, setVehicleFound] = useState(false);
  const [customerVehicles, setCustomerVehicles] = useState<VehicleInfo[]>([]);

  const handleSelectCustomer = (customer: CustomerSuggestion) => {
    setCustomerCc(customer.cc || '');
    setCustomerName(customer.name || '');
    setCustomerPhone(customer.phone || '');
    setCustomerVehicles(customer.vehicles || []);
    setPlate('');
    setCarBrand('');
    setCarModel('');
    setCarColor('');
    setVehicleFound(false);
  };

  const handleSelectVehicle = (vehicle: VehicleInfo) => {
    setPlate(vehicle.plate);
    setCarBrand(vehicle.brand || '');
    setCarModel(vehicle.model || '');
    setCarColor(vehicle.color || '');
    setVehicleFound(true);
  };

  // Paso 2
  const [services, setServices] = useState<Service[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [servicesSearchTerm, setServicesSearchTerm] = useState('');

  // Paso 3
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const handleSearchPlate = async () => {
    if (!plate.trim()) return;
    setIsLoading(true);
    const res = await searchVehicleByPlate(plate.trim());
    setIsLoading(false);
    if (res.success && res.data) {
      const v = res.data;
      setCarBrand(v.brand || '');
      setCarModel(v.model || '');
      setCarColor(v.color || '');
      setCustomerName(v.customer?.name || '');
      setCustomerCc(v.customer?.cc || '');
      setCustomerPhone(v.customer?.phone || '');
      setVehicleFound(true);
    } else {
      setVehicleFound(false);
    }
  };

  const goToServices = async () => {
    if (!plate.trim()) {
      MySwal.fire('Placa requerida', 'Ingresa la placa del vehículo', 'warning');
      return;
    }
    setIsLoading(true);
    const res = await getServicesByCategory(category);
    setIsLoading(false);
    if (res.success) {
      setServices(res.data as Service[]);
      setStep('services');
    } else {
      MySwal.fire('Error', res.message, 'error');
    }
  };

  const toggleService = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredServices = services.filter((s) => {
    if (!servicesSearchTerm.trim()) return true;
    try {
      const regex = new RegExp(servicesSearchTerm, 'i');
      return regex.test(s.name);
    } catch (e) {
      // If regex is invalid, fallback to normal string search
      return s.name.toLowerCase().includes(servicesSearchTerm.toLowerCase());
    }
  });

  const selectedServices = services.filter((s) => selectedIds.has(s.id));
  const total = selectedServices.reduce((acc, s) => acc + s.pvp, 0);

  const handleBill = async (emitirFactura: boolean) => {
    if (selectedIds.size === 0) return;

    const confirm = await MySwal.fire({
      title: emitirFactura ? 'Emitir Factura Electrónica' : 'Confirmar Recibo POS',
      text: `¿Facturar ${selectedIds.size} servicio(s) por $${total.toLocaleString('es-CO')} en ${PAYMENT_LABELS[paymentMethod]}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: emitirFactura ? 'Emitir Factura' : 'Generar Recibo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: emitirFactura ? '#3085d6' : '#475569',
    });
    if (!confirm.isConfirmed) return;

    setIsLoading(true);
    MySwal.showLoading();

    const res = await createAndBillServiceOrder({
      plate: plate.trim(),
      customerName: customerName.trim() || undefined,
      customerCc: customerCc.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      carBrand: carBrand.trim() || undefined,
      carModel: carModel.trim() || undefined,
      carColor: carColor.trim() || undefined,
      serviceIds: Array.from(selectedIds),
      paymentMethod,
      emitirFactura,
    });

    setIsLoading(false);
    MySwal.close();

    if (res.success) {
      setCompletedOrder(res.data);
    } else {
      MySwal.fire('Error', res.message, 'error');
    }
  };

  const stepLabel = { vehicle: 'Vehículo', services: 'Servicios', payment: 'Pago' };
  const steps: Step[] = ['vehicle', 'services', 'payment'];
  const stepIndex = steps.indexOf(step);

  const containerStyle = inline ? {
    background: 'var(--color-surface, #fff)', borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '100%',
    maxWidth: '800px', margin: '0 auto', display: 'flex',
    flexDirection: 'column' as const, overflow: 'hidden', animation: 'fadeIn .3s ease-out',
  } : {
    background: 'var(--color-surface, #fff)', borderRadius: '20px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)', width: '100%',
    maxWidth: '560px', maxHeight: '90vh', display: 'flex',
    flexDirection: 'column' as const, overflow: 'hidden', animation: 'slideUp .3s ease-out',
  };

  const content = (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 24px', borderBottom: '1px solid var(--color-outline-variant, #e5e7eb)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: meta.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: meta.color, fontSize: '22px' }}>{meta.icon}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '16px' }}>Facturar {meta.label}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Venta directa de servicios</div>
        </div>
        {!inline && onClose && (
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6b7280' }}>close</span>
          </button>
        )}
      </div>

          <div style={{ display: 'flex', gap: '8px', padding: '16px 24px 0' }}>
            {steps.map((s, i) => (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ height: '3px', borderRadius: '99px', background: i <= stepIndex ? meta.color : '#e5e7eb', transition: 'background .3s' }} />
                <div style={{ fontSize: '10px', color: i <= stepIndex ? meta.color : '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {i + 1}. {stepLabel[s]}
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {step === 'vehicle' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <CustomerSearchBar onSelectCustomer={handleSelectCustomer} onClear={() => setCustomerVehicles([])} />
                  <VehicleSelector vehicles={customerVehicles} onSelectVehicle={handleSelectVehicle} onClear={() => setPlate('')} />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-outline-variant, #e5e7eb)', margin: '4px 0' }} />

                <div>
                  <label style={labelStyle}>O buscar por Placa del vehículo *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchPlate()}
                      placeholder="ABC123"
                      maxLength={7}
                      style={{ ...inputStyle, flex: 1, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, fontSize: '16px' }}
                    />
                    <button
                      onClick={handleSearchPlate}
                      disabled={isLoading || !plate.trim()}
                      style={{ ...btnOutlineStyle, paddingLeft: '16px', paddingRight: '16px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
                    </button>
                  </div>
                  {vehicleFound && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                      Vehículo encontrado — datos prellenados
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Marca</label>
                    <input value={carBrand} onChange={(e) => setCarBrand(e.target.value)} placeholder="Chevrolet" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Modelo</label>
                    <input value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="Spark" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Color</label>
                    <input value={carColor} onChange={(e) => setCarColor(e.target.value)} placeholder="Blanco" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Teléfono cliente</label>
                    <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="3001234567" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Nombre cliente</label>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Juan Pérez" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>CC cliente</label>
                    <input value={customerCc} onChange={(e) => setCustomerCc(e.target.value)} placeholder="1234567890" style={inputStyle} />
                  </div>
                </div>
              </div>
            )}

            {step === 'services' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                  Selecciona los servicios a facturar para <b>{plate}</b>
                </p>
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '18px' }}>search</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 cursor-pointer shadow-sm"
                    placeholder="Buscar servicios..."
                    type="text"
                    value={servicesSearchTerm}
                    onChange={(e) => setServicesSearchTerm(e.target.value)}
                  />
                </div>
                {services.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No hay servicios activos en esta categoría</div>
                ) : filteredServices.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No hay servicios que coincidan con la búsqueda</div>
                ) : (
                  filteredServices.map((s) => {
                    const isSelected = selectedIds.has(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleService(s.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 16px', borderRadius: '12px', border: `2px solid ${isSelected ? meta.color : '#e5e7eb'}`,
                          background: isSelected ? meta.color + '10' : '#fafafa',
                          cursor: 'pointer', transition: 'all .15s', textAlign: 'left', width: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            border: `2px solid ${isSelected ? meta.color : '#d1d5db'}`,
                            background: isSelected ? meta.color : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {isSelected && <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#fff' }}>check</span>}
                          </div>
                          <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: '14px', color: '#111827' }}>{s.name}</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: meta.color, whiteSpace: 'nowrap' }}>
                          ${s.pvp.toLocaleString('es-CO')}
                        </span>
                      </button>
                    );
                  })
                )}

                {selectedIds.size > 0 && (
                  <div style={{ marginTop: '8px', padding: '12px 16px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #86efac', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 600 }}>{selectedIds.size} servicio(s)</span>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#15803d' }}>${total.toLocaleString('es-CO')}</span>
                  </div>
                )}
              </div>
            )}

            {step === 'payment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ ...labelStyle, marginBottom: '10px', display: 'block' }}>Método de Pago</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {PAYMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPaymentMethod(opt.value)}
                        style={{
                          padding: '14px 8px', borderRadius: '12px', border: `2px solid ${paymentMethod === opt.value ? meta.color : '#e5e7eb'}`,
                          background: paymentMethod === opt.value ? meta.color + '15' : '#fafafa',
                          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ color: paymentMethod === opt.value ? meta.color : '#6b7280', fontSize: '22px' }}>{opt.icon}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: paymentMethod === opt.value ? meta.color : '#374151' }}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Resumen
                  </div>
                  <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>
                    <b>Placa:</b> {plate}
                  </div>
                  {customerName && <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}><b>Cliente:</b> {customerName}</div>}
                  <div style={{ marginTop: '8px' }}>
                    {selectedServices.map((s) => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '2px 0' }}>
                        <span>{s.name}</span>
                        <span style={{ fontWeight: 600 }}>${s.pvp.toLocaleString('es-CO')}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, marginTop: '10px', paddingTop: '10px', borderTop: '2px dashed #e5e7eb' }}>
                    <span>TOTAL</span>
                    <span style={{ color: meta.color }}>${total.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => handleBill(false)}
                    disabled={isLoading || selectedIds.size === 0}
                    style={{ ...btnOutlineStyle, width: '100%', justifyContent: 'center', padding: '14px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt</span>
                    Generar Recibo POS
                  </button>
                  <button
                    onClick={() => handleBill(true)}
                    disabled={isLoading || selectedIds.size === 0}
                    style={{ ...btnPrimaryStyle(meta.color), width: '100%', justifyContent: 'center', padding: '14px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span>
                    Factura Electrónica DIAN
                  </button>
                </div>
              </div>
            )}
          </div>

          {!completedOrder && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              {step !== 'vehicle' ? (
                <button onClick={() => setStep(step === 'payment' ? 'services' : 'vehicle')} style={btnOutlineStyle}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                  Atrás
                </button>
              ) : <div />}

              {step === 'vehicle' && (
                <button onClick={goToServices} disabled={isLoading || !plate.trim()} style={btnPrimaryStyle(meta.color)}>
                  Continuar <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                </button>
              )}
              {step === 'services' && (
                <button onClick={() => { if (selectedIds.size === 0) { MySwal.fire('', 'Selecciona al menos un servicio', 'warning'); return; } setStep('payment'); }} style={btnPrimaryStyle(meta.color)}>
                  Continuar <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                </button>
              )}
            </div>
          )}
        </div>
    );

  return (
    <>
      {inline ? (
        <div style={{ display: 'flex', flex: 1, padding: '20px', width: '100%', justifyContent: 'center' }}>
          {content}
        </div>
      ) : (
        <div
          onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9990,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn .2s ease-out',
          }}
        >
          {content}
        </div>
      )}

      {completedOrder && (
        <ServiceOrderReceiptModal
          order={completedOrder}
          onClose={() => { setCompletedOrder(null); if (onClose) onClose(); }}
        />
      )}
    </>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: '4px' };
const inputStyle: React.CSSProperties = { width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box' };
const btnOutlineStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fff', fontWeight: 600, fontSize: '14px', color: '#374151', cursor: 'pointer' };
const btnPrimaryStyle = (color: string): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: color, fontWeight: 700, fontSize: '14px', color: '#fff', cursor: 'pointer' });

const PAYMENT_LABELS: Record<string, string> = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' };
