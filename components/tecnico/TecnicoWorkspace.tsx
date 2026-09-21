'use client';

import React, { useState, useEffect } from 'react';
import { RegistrationForm } from './RegistrationForm';
import { ServicesPanel } from './ServicesPanel';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { searchByPlate, createOrder } from '@/actions/orders';
import { useRouter } from 'next/navigation';
import { NextAppointmentModal } from './NextAppointmentModal';
import { InsumosPanel } from './InsumosPanel';

const MySwal = withReactContent(Swal);

interface TecnicoWorkspaceProps {
  catalogServices: any[];
  userDepartment?: string | null;
  insumos?: { id: string; name: string; stock: number }[];
}

// Tipo para orden existente en pista
interface ExistingOrder {
  id: string;
  orderNumber: number;
  technicianName: string;
  totalServices: number;
  totalProducts: number;
  grandTotal: number;
  services: { id: string; name: string; chargedPrice: number; technicianName: string }[];
  products: { id: string; name: string; quantity: number; unitPrice: number }[];
}

// Tipo para producto seleccionado por el técnico
interface SelectedProduct {
  productId: string;
  quantity: number;
  name: string;
  unitPrice: number;
}

export function TecnicoWorkspace({ catalogServices, userDepartment, insumos }: TecnicoWorkspaceProps) {
  const router = useRouter();

  const [plate, setPlate] = useState('');
  const [customerCc, setCustomerCc] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerVehicles, setCustomerVehicles] = useState<{ id: string; plate: string; brand: string | null; model: string | null; color: string | null }[]>([]);

  // Orden existente EN_PISTA para la placa actual
  const [existingOrder, setExistingOrder] = useState<ExistingOrder | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Right panel tabs
  const [activeRightTab, setActiveRightTab] = useState<'servicios' | 'insumos'>('servicios');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [nextMaintenanceReason, setNextMaintenanceReason] = useState('');

  // Handler para autocompletar datos del cliente seleccionado.
  const handleSelectCustomer = (customer: { cc: string | null; name: string | null; phone: string | null; email: string | null; vehicles: { id: string; plate: string; brand: string | null; model: string | null; color: string | null }[] }) => {
    setCustomerCc(customer.cc || '');
    setCustomerName(customer.name || '');
    setCustomerPhone(customer.phone || '');
    setCustomerEmail(customer.email || '');
    setCustomerVehicles(customer.vehicles || []);
    // Limpia campos de vehículo para forzar selección explícita
    setPlate('');
    setCarBrand('');
    setCarModel('');
    setCarColor('');
    setExistingOrder(null);
  };

  // Handler para autocompletar datos del vehículo seleccionado desde el dropdown.
  const handleSelectVehicle = (vehicle: { plate: string; brand: string | null; model: string | null; color: string | null }) => {
    setPlate(vehicle.plate);
    setCarBrand(vehicle.brand || '');
    setCarModel(vehicle.model || '');
    setCarColor(vehicle.color || '');
  };

  // Debounced search for plate — ahora también carga existingOrder
  useEffect(() => {
    const trimmedPlate = plate.replace(/\s+/g, '').toUpperCase();
    if (trimmedPlate.length >= 5) {
      const delayDebounceFn = setTimeout(async () => {
        const res = await searchByPlate(trimmedPlate);
        if (res.success) {
          if (res.data && res.data.customer) {
            const cust = res.data.customer;
            setCustomerCc(cust.cc || '');
            setCustomerName(cust.name || '');
            setCustomerPhone(cust.phone || '');
            setCustomerEmail(cust.email || '');
            
            setCarBrand(res.data.brand || '');
            setCarModel(res.data.model || '');
            setCarColor(res.data.color || '');
          }

          // Actualizar orden existente
          setExistingOrder((res as any).existingOrder || null);

          if (res.data && (res as any).existingOrder) {
            MySwal.fire({
              toast: true,
              position: 'top-end',
              icon: 'info',
              title: `Vehículo en pista — Orden #${(res as any).existingOrder.orderNumber}`,
              text: 'Los servicios que selecciones se acumularán en esta orden.',
              showConfirmButton: false,
              timer: 3500,
            });
          } else if (res.data) {
            MySwal.fire({
              toast: true,
              position: 'top-end',
              icon: 'info',
              title: 'Vehículo encontrado',
              showConfirmButton: false,
              timer: 2000,
            });
          }
        }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setExistingOrder(null);
    }
  }, [plate]);

  const handleToggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Agregar / quitar producto para enviar a caja
  const handleToggleProduct = (productId: string, name: string, unitPrice: number) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.productId === productId);
      if (exists) {
        return prev.filter(p => p.productId !== productId);
      }
      return [...prev, { productId, quantity: 1, name, unitPrice }];
    });
  };

  const handleChangeProductQty = (productId: string, quantity: number) => {
    setSelectedProducts(prev =>
      prev.map(p => p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p)
    );
  };

  const resetWorkspace = () => {
    setPlate('');
    setCustomerCc('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCarBrand('');
    setCarModel('');
    setCarColor('');
    setSelectedServices([]);
    setSelectedProducts([]);
    setCustomerVehicles([]);
    setExistingOrder(null);
    setNextMaintenanceDate('');
    setNextMaintenanceReason('');
    router.refresh();
  };

  const handleCreateOrder = async () => {
    if (!plate || plate.length < 5) {
      MySwal.fire('Error', 'Debe ingresar una placa válida', 'error');
      return;
    }
    if (selectedServices.length === 0) {
      MySwal.fire('Error', 'Debe seleccionar al menos un servicio', 'error');
      return;
    }

    setIsSubmitting(true);
    MySwal.showLoading();

    const res = await createOrder({
      plate,
      customerCc,
      customerName,
      customerPhone,
      customerEmail,
      carBrand,
      carModel,
      carColor,
      services: selectedServices,
      products: selectedProducts.length > 0
        ? selectedProducts.map(p => ({ productId: p.productId, quantity: p.quantity }))
        : undefined,
      nextMaintenanceDate: nextMaintenanceDate || undefined,
      nextMaintenanceReason: nextMaintenanceReason || undefined,
    });

    setIsSubmitting(false);
    MySwal.close();

    if (res.success) {
      MySwal.fire({
        toast: true,
        position: 'top-end',
        title: res.message || '¡Enviado a caja exitosamente!',
        icon: 'success',
        showConfirmButton: false,
        timer: 3000,
      });
      resetWorkspace();
    } else {
      MySwal.fire('Error', res.message, 'error');
    }
  };

  const handleSaveRecommendation = (date: string, reason: string) => {
    setNextMaintenanceDate(date);
    setNextMaintenanceReason(reason);
    setIsModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const [activeTab, setActiveTab] = useState<'registro' | 'servicios'>('registro');

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">

      {/* Tabs — solo visible en tablet (oculto en lg+) */}
      <div className="lg:hidden flex border-b border-surface-variant bg-surface-container-lowest">
        <button
          type="button"
          onClick={() => setActiveTab('registro')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'registro'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">directions_car</span>
          Registro de Vehículo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('servicios')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border-b-2 relative ${
            activeTab === 'servicios'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">build</span>
          Servicios
          {selectedServices.length > 0 && (
            <span className="absolute top-2 right-6 bg-primary text-on-primary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
              {selectedServices.length}
            </span>
          )}
        </button>
      </div>

      {/* Layout lado a lado en lg+; tabs en tablet/mobile */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Panel Registro — visible en lg siempre; en tablet según tab activa */}
        <div className={`flex-1 lg:flex lg:w-2/5 flex-col overflow-hidden ${
          activeTab === 'registro' ? 'flex' : 'hidden lg:flex'
        }`}>
          <RegistrationForm
            plate={plate} setPlate={setPlate}
            customerCc={customerCc} setCustomerCc={setCustomerCc}
            customerName={customerName} setCustomerName={setCustomerName}
            customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
            customerEmail={customerEmail} setCustomerEmail={setCustomerEmail}
            carBrand={carBrand} setCarBrand={setCarBrand}
            carModel={carModel} setCarModel={setCarModel}
            carColor={carColor} setCarColor={setCarColor}
            onSelectCustomer={handleSelectCustomer}
            customerVehicles={customerVehicles}
            onSelectVehicle={handleSelectVehicle}
            nextMaintenanceDate={nextMaintenanceDate}
            nextMaintenanceReason={nextMaintenanceReason}
            onOpenRecommendationModal={() => setIsModalOpen(true)}
            existingOrder={existingOrder}
          />
        </div>

        {/* Panel Servicios / Insumos — visible en lg siempre; en tablet según tab activa */}
        <div className={`flex-1 lg:flex lg:w-3/5 flex-col overflow-hidden ${
          activeTab === 'servicios' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Tabs for right panel */}
          <div className="flex border-b border-surface-variant bg-surface-container-lowest shrink-0">
            <button
              type="button"
              onClick={() => setActiveRightTab('servicios')}
              className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border-b-2 relative ${
                activeRightTab === 'servicios'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">build</span>
              Catálogo de Servicios
              {selectedServices.length > 0 && (
                <span className="absolute top-2 right-4 bg-primary text-on-primary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {selectedServices.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveRightTab('insumos')}
              className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border-b-2 relative ${
                activeRightTab === 'insumos'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              Stock de Insumos
              {selectedProducts.length > 0 && (
                <span className="absolute top-2 right-4 bg-secondary text-on-secondary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {selectedProducts.length}
                </span>
              )}
            </button>
          </div>

          <div className={`flex-1 flex-col overflow-hidden ${activeRightTab === 'servicios' ? 'flex' : 'hidden'}`}>
            <ServicesPanel
              catalogServices={userDepartment ? catalogServices.filter(s => s.category === userDepartment) : catalogServices}
              selectedServices={selectedServices}
              onToggleService={handleToggleService}
              onSubmit={handleCreateOrder}
              isSubmitting={isSubmitting}
              selectedProducts={selectedProducts}
              existingOrder={existingOrder}
            />
          </div>
          
          <div className={`flex-1 flex-col overflow-hidden ${activeRightTab === 'insumos' ? 'flex' : 'hidden'}`}>
            <InsumosPanel
              insumos={insumos || []}
              selectedProducts={selectedProducts}
              onToggleProduct={handleToggleProduct}
              onChangeProductQty={handleChangeProductQty}
            />
          </div>
        </div>
      </div>

      <NextAppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmitOrder={handleSaveRecommendation}
        department={userDepartment}
        customerName={customerName}
        vehiclePlate={plate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
