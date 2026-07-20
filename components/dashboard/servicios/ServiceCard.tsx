'use client';

import React, { useState } from 'react';
import { ACTION_ICONS } from '@/constants/icons';
import { updateService, deleteService } from '@/actions/car_services';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui';

const MySwal = withReactContent(Swal);

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    icon?: string | null;
    category?: string | null;
    basePrice: any;
    description?: string | null;
    isActive?: boolean;
  };
}

export function ServiceCard({ service }: ServiceCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState(service.name);
  const [basePrice, setBasePrice] = useState(Number(service.basePrice));
  const [category, setCategory] = useState(service.category || '');

  const formatPrice = (price: any) => {
    return new Intl.NumberFormat('es-CO').format(Number(price));
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
    // Reset fields if canceling
    if (isEditing) {
      setName(service.name);
      setBasePrice(Number(service.basePrice));
      setCategory(service.category || '');
    }
  };

  const handleDelete = async () => {
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgba(221, 213, 51, 1)',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: '!text-black'
      }
    });

    if (result.isConfirmed) {
      const res = await deleteService(service.id);
      if (res.success) {
        MySwal.fire('Eliminado!', res.message, 'success');
        router.refresh();
      } else {
        MySwal.fire('Error', res.message, 'error');
      }
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    const res = await updateService(service.id, {
      name,
      basePrice,
      category,
      icon: service.icon || undefined
    });

    setIsSubmitting(false);
    if (res.success) {
      MySwal.fire({
        title: '¡Guardado!',
        text: res.message,
        icon: 'success',
        confirmButtonColor: 'rgba(221, 213, 51, 1)',
        customClass: { confirmButton: '!text-black' }
      });
      setIsEditing(false);
      router.refresh();
    } else {
      MySwal.fire('Error', res.message, 'error');
    }
  };

  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative">
      {/* Top Section */}
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-surface-container-high text-on-surface-variant rounded-lg flex items-center justify-center border border-outline-variant/50">
          <span className="material-symbols-outlined text-[24px]">
            {service.icon || 'car_repair'}
          </span>
        </div>

        <div className="flex items-center gap-3">

          <button
            onClick={handleEdit}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary ${isEditing ? 'bg-primary-container text-on-primary-container' : 'text-secondary hover:bg-secondary-container hover:text-on-secondary-container'}`}
            title="Editar"
          >
            <span className="material-symbols-outlined text-[18px]">{ACTION_ICONS.edit}</span>
          </button>
          <button
            onClick={handleDelete}
            className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-error"
            title="Eliminar"
          >
            <span className="material-symbols-outlined text-[18px]">{ACTION_ICONS.delete}</span>
          </button>
        </div>
      </div>

      {/* Body Section */}
      <div className="flex-grow space-y-4">
        <div>
          <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Nombre del Servicio</label>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 px-3 text-on-surface"
            />
          ) : (
            <div className="h-11 w-full rounded-lg border border-outline-variant/60 bg-surface px-3 flex items-center text-on-surface shadow-sm">
              {service.name}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Precio (PVP)</label>
            {isEditing ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-fixed-dim">$</span>
                <input
                  type="text"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value.replace(/\D/g, '')))}
                  className="h-11 form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 pl-7 pr-3 text-on-surface"
                />
              </div>
            ) : (
              <div className="h-11 w-full rounded-lg border border-outline-variant/60 bg-surface px-3 flex items-center text-on-surface shadow-sm">
                $ {formatPrice(service.basePrice)}
              </div>
            )}
          </div>

          <div>
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Categoría</label>
            {isEditing ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 form-select w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 px-3 text-on-surface"
              >
                <option value="LAVADERO">LAVADERO</option>
                <option value="SERVITECA">SERVITECA</option>
              </select>
            ) : (
              <div className="h-11 w-full rounded-lg border border-outline-variant/60 bg-surface px-3 flex items-center text-on-surface shadow-sm truncate">
                {service.category || 'N/A'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Section */}
      {isEditing && (
        <div className="mt-6 pt-5 border-t border-outline-variant/50 flex justify-end">
          <PrimaryButton onClick={handleSave} disabled={isSubmitting} className="h-10 text-sm px-4">
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
