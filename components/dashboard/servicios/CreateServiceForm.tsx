'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { z } from 'zod';
import { createServiceSchema, CreateServiceFormValues } from '@/validation';
import { createService } from '@/actions/car_services';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PriceInput } from '@/components/ui/PriceInput';
import { IconPicker } from '@/components/ui/IconPicker';

const MySwal = withReactContent(Swal);

export function CreateServiceForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  type FormInput = z.input<typeof createServiceSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput, any, CreateServiceFormValues>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      name: '',
      icon: '',
      category: undefined,
      basePrice: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateServiceFormValues) => {
    setIsSubmitting(true);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      // Avoid sending empty strings for optional enums if we want them undefined
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value.toString());
      }
    });

    const result = await createService(formData);

    setIsSubmitting(false);

    if (result.success) {
      MySwal.fire({
        title: '¡Servicio creado!',
        text: result.message,
        icon: 'success',
        confirmButtonColor: 'rgba(221, 213, 51, 1)',
        customClass: {
          confirmButton: '!text-black'
        }
      }).then(() => {
        // Redirigir al catálogo
        router.push('/dashboard/servicios'); 
      });
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

  return (
    <div className="max-w-4xl mx-auto bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-6 md:p-8">
      <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-gutter gap-y-6">

          {/* Nombre del Servicio */}
          <div className="col-span-1 md:col-span-2">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Nombre del Servicio</label>
            <input
              {...register('name')}
              className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.name ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="Ej. Cambio de Aceite y Filtro"
              type="text"
            />
            <ErrorMessage message={errors.name?.message} />
          </div>

          {/* Icon Picker */}
          <IconPicker
            name="icon"
            label="Ícono del Servicio"
            setValue={setValue}
            watch={watch}
            errors={errors}
          />

          {/* Categoría Dropdown */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Categoría</label>
            <div className="relative">
              <select
                {...register('category')}
                className={`h-[56px] form-select w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 pr-10 text-on-surface appearance-none cursor-pointer ${errors.category ? 'border-error focus:border-error focus:ring-error' : ''}`}
              >
                <option disabled value="">Seleccione una categoría...</option>
                <option value="LAVADERO">Lavadero</option>
                <option value="SERVITECA">Serviteca</option>
                <option value="LUBRICANTES">Lubricantes</option>
                <option value="ACCESORIOS">Accesorios</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </div>
            </div>
            <ErrorMessage message={errors.category?.message} />
          </div>

          {/* Precio Base */}
          <PriceInput
            name="basePrice"
            label="Precio Base ($)"
            register={register}
            setValue={setValue}
            errors={errors}
            placeholder="0"
          />

          {/* Descripción */}
          <div className="col-span-1 md:col-span-2">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Descripción (Opcional)</label>
            <textarea
              {...register('description')}
              className={`min-h-[100px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow p-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.description ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="Detalles del servicio..."
            />
            <ErrorMessage message={errors.description?.message} />
          </div>

        </div>

        {/* Divider */}
        <hr className="border-outline-variant/50 border-t my-8" />

        {/* Acciones */}
        <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="cursor-pointer w-full sm:w-auto h-[56px] px-8 rounded-full border-2 border-outline-variant text-secondary font-cta text-cta hover:bg-surface-container-high transition-colors focus:ring-2 focus:ring-outline focus:outline-none"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="cursor-pointer w-full sm:w-auto h-[56px] px-8 rounded-full bg-primary-container text-on-primary-container font-cta text-cta hover:bg-primary-fixed-dim transition-all shadow-sm active:scale-95 duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined">save</span>
            )}
            Guardar Servicio
          </button>
        </div>
      </form>
    </div>
  );
}
