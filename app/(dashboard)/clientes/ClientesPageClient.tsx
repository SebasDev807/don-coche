'use client';

import React from 'react';
import { CustomerList } from '@/components/dashboard/clientes/CustomerList';
import { CustomerProfile } from '@/components/dashboard/clientes/CustomerProfile';
import { PrimaryButton } from '@/components/ui';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { createCustomer, updateCustomer } from '@/actions/customers';
import { createVehicle } from '@/actions/vehicles';
import { useRouter } from 'next/navigation';

const MySwal = withReactContent(Swal);

interface ClientesPageClientProps {
  customers: any[];
  selectedId?: string;
}

export function ClientesPageClient({ customers, selectedId }: ClientesPageClientProps) {
  const router = useRouter();
  const selectedCustomer = customers.find((c) => c.id === selectedId) || null;

  const handleCreateCustomer = async () => {
    const { value: formValues } = await MySwal.fire({
      title: 'Nuevo Cliente',
      html: `
        <div class="flex flex-col gap-4 text-left mt-4">
          <div>
            <label class="block font-label-bold text-on-surface-variant mb-1">Nombre Completo *</label>
            <input id="swal-c-name" class="h-11 form-input w-full rounded-lg border-outline-variant px-3" placeholder="Ej. Juan Pérez" />
          </div>
          <div>
            <label class="block font-label-bold text-on-surface-variant mb-1">WhatsApp / Teléfono</label>
            <input id="swal-c-phone" class="h-11 form-input w-full rounded-lg border-outline-variant px-3" placeholder="Ej. 3001234567" />
          </div>
          <div>
            <label class="block font-label-bold text-on-surface-variant mb-1">Correo Electrónico</label>
            <input id="swal-c-email" type="email" class="h-11 form-input w-full rounded-lg border-outline-variant px-3" placeholder="Ej. juan@correo.com" />
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'rgba(221, 213, 51, 1)',
      cancelButtonColor: '#6b7280',
      customClass: { confirmButton: '!text-black' },
      preConfirm: () => {
        const name = (document.getElementById('swal-c-name') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-c-phone') as HTMLInputElement).value;
        const email = (document.getElementById('swal-c-email') as HTMLInputElement).value;

        if (!name || name.length < 2) {
          Swal.showValidationMessage('El nombre debe tener al menos 2 caracteres.');
          return false;
        }
        return { name, phone, email };
      }
    });

    if (formValues) {
      MySwal.showLoading();
      const result = await createCustomer(formValues);
      if (result.success) {
        MySwal.fire('¡Éxito!', result.message, 'success');
        // Auto select new customer
        if (result.data) {
          router.push(`/clientes?selected=${result.data.id}`);
        }
      } else {
        MySwal.fire('Error', result.message, 'error');
      }
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;

    const { value: formValues } = await MySwal.fire({
      title: 'Editar Cliente',
      html: `
        <div class="flex flex-col gap-4 text-left mt-4">
          <div>
            <label class="block font-label-bold text-on-surface-variant mb-1">Nombre Completo *</label>
            <input id="swal-c-name" class="h-11 form-input w-full rounded-lg border-outline-variant px-3" value="${selectedCustomer.name || ''}" />
          </div>
          <div>
            <label class="block font-label-bold text-on-surface-variant mb-1">WhatsApp / Teléfono</label>
            <input id="swal-c-phone" class="h-11 form-input w-full rounded-lg border-outline-variant px-3" value="${selectedCustomer.phone || ''}" />
          </div>
          <div>
            <label class="block font-label-bold text-on-surface-variant mb-1">Correo Electrónico</label>
            <input id="swal-c-email" type="email" class="h-11 form-input w-full rounded-lg border-outline-variant px-3" value="${selectedCustomer.email || ''}" />
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'rgba(221, 213, 51, 1)',
      cancelButtonColor: '#6b7280',
      customClass: { confirmButton: '!text-black' },
      preConfirm: () => {
        const name = (document.getElementById('swal-c-name') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-c-phone') as HTMLInputElement).value;
        const email = (document.getElementById('swal-c-email') as HTMLInputElement).value;

        if (!name || name.length < 2) {
          Swal.showValidationMessage('El nombre es requerido.');
          return false;
        }
        return { name, phone, email };
      }
    });

    if (formValues) {
      MySwal.showLoading();
      const result = await updateCustomer(selectedCustomer.id, formValues);
      if (result.success) {
        MySwal.fire('¡Actualizado!', result.message, 'success');
      } else {
        MySwal.fire('Error', result.message, 'error');
      }
    }
  };

  const handleAddVehicle = async () => {
    if (!selectedCustomer) return;

    const { value: formValues } = await MySwal.fire({
      title: 'Añadir Vehículo',
      html: `
        <div class="flex flex-col gap-4 text-left mt-4">
          <div>
            <label class="block font-label-bold text-on-surface-variant mb-1">Placa *</label>
            <input id="swal-v-plate" class="h-11 form-input w-full rounded-lg border-outline-variant px-3 uppercase text-lg tracking-wider" placeholder="ABC123" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-label-bold text-on-surface-variant mb-1">Marca</label>
              <input id="swal-v-brand" class="h-11 form-input w-full rounded-lg border-outline-variant px-3" placeholder="Ej. Chevrolet" />
            </div>
            <div>
              <label class="block font-label-bold text-on-surface-variant mb-1">Modelo</label>
              <input id="swal-v-model" class="h-11 form-input w-full rounded-lg border-outline-variant px-3" placeholder="Ej. Spark GT" />
            </div>
          </div>
          <div>
            <label class="block font-label-bold text-on-surface-variant mb-1">Color</label>
            <input id="swal-v-color" class="h-11 form-input w-full rounded-lg border-outline-variant px-3" placeholder="Ej. Rojo" />
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'rgba(221, 213, 51, 1)',
      cancelButtonColor: '#6b7280',
      customClass: { confirmButton: '!text-black' },
      preConfirm: () => {
        const plate = (document.getElementById('swal-v-plate') as HTMLInputElement).value.toUpperCase();
        const brand = (document.getElementById('swal-v-brand') as HTMLInputElement).value;
        const model = (document.getElementById('swal-v-model') as HTMLInputElement).value;
        const color = (document.getElementById('swal-v-color') as HTMLInputElement).value;

        if (!plate || plate.length < 5) {
          Swal.showValidationMessage('La placa es requerida y debe ser válida.');
          return false;
        }
        return { plate, brand, model, color };
      }
    });

    if (formValues) {
      MySwal.showLoading();
      const result = await createVehicle(selectedCustomer.id, formValues);
      if (result.success) {
        MySwal.fire('¡Éxito!', result.message, 'success');
      } else {
        MySwal.fire('Error', result.message, 'error');
      }
    }
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row bg-surface border border-outline-variant/60 rounded-xl overflow-hidden shadow-sm h-[calc(100vh-250px)] min-h-[600px]">

      {/* Master List */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col border-r border-outline-variant/60 bg-surface">
        <div className="p-4 border-b border-outline-variant/60 bg-surface-container-lowest">
          <PrimaryButton onClick={handleCreateCustomer} className="w-full h-11 text-sm justify-center">
            <span className="material-symbols-outlined">person_add</span>
            Nuevo Cliente
          </PrimaryButton>
        </div>
        <div className="flex-grow overflow-hidden">
          <CustomerList customers={customers} />
        </div>
      </div>

      {/* Detail Profile */}
      <div className="w-full md:w-2/3 lg:w-3/4 flex-grow overflow-hidden bg-surface-container-lowest">
        <CustomerProfile
          customer={selectedCustomer}
          onEditCustomer={handleEditCustomer}
          onAddVehicle={handleAddVehicle}
        />
      </div>

    </div>
  );
}
