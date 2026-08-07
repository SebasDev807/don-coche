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



  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
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
      <ServicesPanel 
        catalogServices={userDepartment ? catalogServices.filter(s => s.category === userDepartment) : catalogServices}
        selectedServices={selectedServices}
        onToggleService={handleToggleService}
        onSubmit={handleCreateOrder}
        isSubmitting={isSubmitting}
      />

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
