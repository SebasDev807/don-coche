'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { createCategorySchema, CreateCategoryFormValues } from '@/validation';
import { createCategory } from '@/actions/inventory';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const MySwal = withReactContent(Swal);

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: () => void;
}

export function CreateCategoryModal({ isOpen, onClose, onCategoryCreated }: CreateCategoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (data: CreateCategoryFormValues) => {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('name', data.name);

    const result = await createCategory(formData);

    setIsSubmitting(false);

    if (result.success) {
      MySwal.fire({
        title: '¡Categoría creada!',
        text: result.message,
        icon: 'success',
        confirmButtonColor: 'rgba(221, 213, 51, 1)',
        customClass: {
          confirmButton: '!text-black'
        },
        timer: 1500,
        showConfirmButton: false,
      });
      reset();
      onCategoryCreated();
      onClose();
    } else {
      MySwal.fire({
        title: 'Error',
        text: result.message,
        icon: 'error',
        confirmButtonColor: 'rgba(221, 213, 51, 1)',
        customClass: {
          confirmButton: '!text-black'
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-lg border border-surface-variant overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/50">
          <h2 className="font-title-lg text-title-lg text-on-surface">Nueva Categoría</h2>
          <button 
            onClick={onClose}
            className="text-secondary hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Nombre de la Categoría</label>
            <input 
              {...register('name')}
              className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.name ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="Ej. Llantas" 
              type="text"
              autoFocus
            />
            <ErrorMessage message={errors.name?.message} />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="cursor-pointer w-full sm:w-auto h-[48px] px-6 rounded-full border-2 border-outline-variant text-secondary font-cta text-cta hover:bg-surface-container-high transition-colors focus:ring-2 focus:ring-outline focus:outline-none"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="cursor-pointer w-full sm:w-auto h-[48px] px-6 rounded-full bg-primary-container text-on-primary-container font-cta text-cta hover:bg-primary-fixed-dim transition-all shadow-sm active:scale-95 duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">save</span>
              )}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
