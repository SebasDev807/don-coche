'use client';

import React, { useState, useEffect } from 'react';
import { RegistrationForm } from './RegistrationForm';
import { ServicesPanel } from './ServicesPanel';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { searchByPlate, createOrder } from '@/actions/orders';
import { useRouter } from 'next/navigation';

const MySwal = withReactContent(Swal);

interface TecnicoWorkspaceProps {
  catalogServices: any[];
  userDepartment?: string | null;
}

export function TecnicoWorkspace({ catalogServices, userDepartment }: TecnicoWorkspaceProps) {
  const router = useRouter();

  const [plate, setPlate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced search for plate
  useEffect(() => {
    const trimmedPlate = plate.replace(/\s+/g, '').toUpperCase();
    if (trimmedPlate.length >= 5) {
      const delayDebounceFn = setTimeout(async () => {
        const res = await searchByPlate(trimmedPlate);
        if (res.success && res.data && res.data.customer) {
          const cust = res.data.customer;
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
      customerName,
      customerPhone,
      customerEmail,
      carBrand,
      carModel,
      carColor,
      services: selectedServices
    });

    setIsSubmitting(false);

    if (res.success) {
      await MySwal.fire('¡Éxito!', 'La orden ha sido enviada a la pista.', 'success');
      // Reset form
      setPlate('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCarBrand('');
      setCarModel('');
      setCarColor('');
      setSelectedServices([]);
      router.refresh();
    } else {
      MySwal.fire('Error', res.message, 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      <RegistrationForm 
        plate={plate} setPlate={setPlate}
        customerName={customerName} setCustomerName={setCustomerName}
        customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
        customerEmail={customerEmail} setCustomerEmail={setCustomerEmail}
        carBrand={carBrand} setCarBrand={setCarBrand}
        carModel={carModel} setCarModel={setCarModel}
        carColor={carColor} setCarColor={setCarColor}
      />
      <ServicesPanel 
        catalogServices={userDepartment ? catalogServices.filter(s => s.category === userDepartment) : catalogServices}
        selectedServices={selectedServices}
        onToggleService={handleToggleService}
        onSubmit={handleCreateOrder}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
