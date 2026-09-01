'use client';

import React, { useState, useEffect } from 'react';
import { RegistrationForm } from './RegistrationForm';
import { ServicesPanel } from './ServicesPanel';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { searchByPlate, createOrder } from '@/actions/orders';
import { useRouter } from 'next/navigation';
import { NextAppointmentModal } from './NextAppointmentModal';

const MySwal = withReactContent(Swal);

interface TecnicoWorkspaceProps {
  catalogServices: any[];
  userDepartment?: string | null;
}

export function TecnicoWorkspace({ catalogServices, userDepartment }: TecnicoWorkspaceProps) {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerVehicles, setCustomerVehicles] = useState<{ id: string; plate: string; brand: string | null; model: string | null; color: string | null }[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [nextMaintenanceReason, setNextMaintenanceReason] = useState('');

  // Handler para autocompletar datos del cliente seleccionado.
  // Almacena los vehículos del cliente y limpia los campos del vehículo para que el técnico seleccione uno.
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
  };

  // Handler para autocompletar datos del vehículo seleccionado desde el dropdown.
  const handleSelectVehicle = (vehicle: { plate: string; brand: string | null; model: string | null; color: string | null }) => {
    setPlate(vehicle.plate);
    setCarBrand(vehicle.brand || '');
    setCarModel(vehicle.model || '');
    setCarColor(vehicle.color || '');
  };

  // Debounced search for plate
  useEffect(() => {
    const trimmedPlate = plate.replace(/\s+/g, '').toUpperCase();
    if (trimmedPlate.length >= 5) {
      const delayDebounceFn = setTimeout(async () => {
        const res = await searchByPlate(trimmedPlate);
        if (res.success && res.data && res.data.customer) {
          const cust = res.data.customer;
          setCustomerCc(cust.cc || '');
          setCustomerName(cust.name || '');
          setCustomerPhone(cust.phone || '');
          setCustomerEmail(cust.email || '');
          
          setCarBrand(res.data.brand || '');
          setCarModel(res.data.model || '');
          setCarColor(res.data.color || '');
          
          MySwal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Vehículo encontrado',
            showConfirmButton: false,
            timer: 2000
          });
        }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [plate]);

  const handleToggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
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
    setCustomerVehicles([]);
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

    if (!nextMaintenanceReason) {
      MySwal.fire('Error', 'Debe asignar el motivo del próximo servicio (campo obligatorio en el formulario)', 'error');
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
      nextMaintenanceDate: nextMaintenanceDate || undefined,
      nextMaintenanceReason: nextMaintenanceReason || undefined
    });

    setIsSubmitting(false);
    MySwal.close();

    if (res.success) {
      MySwal.fire({
        toast: true,
        position: 'top-end',
        title: '¡Orden y recomendación guardadas!',
        icon: 'success',
        showConfirmButton: false,
        timer: 3000
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
          />
        </div>

        {/* Panel Servicios — visible en lg siempre; en tablet según tab activa */}
        <div className={`flex-1 lg:flex lg:w-3/5 flex-col overflow-hidden ${
          activeTab === 'servicios' ? 'flex' : 'hidden lg:flex'
        }`}>
          <ServicesPanel
            catalogServices={userDepartment ? catalogServices.filter(s => s.category === userDepartment) : catalogServices}
            selectedServices={selectedServices}
            onToggleService={handleToggleService}
            onSubmit={handleCreateOrder}
            isSubmitting={isSubmitting}
          />
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
