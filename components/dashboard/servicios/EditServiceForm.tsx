'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { editServiceSchema, EditServiceFormValues } from '@/validation/car_services/edit_service';
import { updateService } from '@/actions/car_services/update_service.action';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PriceInput } from '@/components/ui/PriceInput';
import { useSellingPrice } from '@/hooks';
import { z } from 'zod';

const MySwal = withReactContent(Swal);

interface EditServiceFormProps {
  id: string;
  defaultValues: {
    slug?: string;
    name?: string;
    category?: 'LAVADERO' | 'SERVITECA';
    basePrice?: string | number;
    profitPercentage?: string | number;
    description?: string;
  };
}

export function EditServiceForm({ id, defaultValues }: EditServiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  type FormInput = z.input<typeof editServiceSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput, any, EditServiceFormValues>({
    resolver: zodResolver(editServiceSchema),
    defaultValues: {
      slug: defaultValues.slug,
      name: defaultValues.name ?? '',
      category: defaultValues.category ?? undefined,
      basePrice: (defaultValues.basePrice ?? '') as unknown as number,
      profitPercentage: (defaultValues.profitPercentage ?? '') as unknown as number,
      description: defaultValues.description ?? '',
    },
  });

  const basePriceValue = watch('basePrice');
  const profitPercentageValue = watch('profitPercentage');
  const { formattedSellingPrice } = useSellingPrice(basePriceValue as number, profitPercentageValue as number);

  const onSubmit = async (data: EditServiceFormValues) => {
    setIsSubmitting(true);
    
    // We prepare the data for the action
    const updateData = {
      name: data.name,
      basePrice: data.basePrice,
      category: data.category,
      profitPercentage: data.profitPercentage,
      description: data.description,
    };

    const result = await updateService(id, updateData);
    
    setIsSubmitting(false);

    if (result.success) {
      MySwal.fire({
        title: '¡Servicio actualizado!',
        text: result.message,
        icon: 'success',
        confirmButtonColor: 'rgba(221, 213, 51, 1)',
        customClass: { confirmButton: '!text-black' },
      }).then(() => {
        router.push('/servicios');
        router.refresh();
      });
    } else {
      MySwal.fire({
        title: 'Error',
        text: result.message,
        icon: 'error',
        confirmButtonColor: 'rgba(221, 213, 51, 1)',
        customClass: { confirmButton: '!text-black' },
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-6 md:p-8">
      <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-gutter gap-y-6">

          {/* Nombre */}
          <div className="col-span-1 md:col-span-2">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Nombre del Servicio</label>
            <input
              {...register('name')}
              type="text"
              className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.name ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="Ej. Cambio de Aceite"
            />
            <ErrorMessage message={errors.name?.message} />
          </div>

          {/* Categoría */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Categoría</label>
            <div className="relative">
              <select
                {...register('category')}
                className={`h-[56px] form-select w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 pr-10 text-on-surface appearance-none cursor-pointer ${errors.category ? 'border-error focus:border-error focus:ring-error' : ''}`}
              >
                <option disabled value="">Seleccione una categoría…</option>
                <option value="LAVADERO">Lavadero</option>
                <option value="SERVITECA">Serviteca</option>
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

          {/* Porcentaje de Ganancia */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">% de Ganancia</label>
            <input
              {...register('profitPercentage')}
              type="number"
              min="0"
              max="100"
              step="5"
              className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.profitPercentage ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="Ej. 15"
            />
            <ErrorMessage message={errors.profitPercentage?.message} />
          </div>

          {/* Precio de Venta al Público */}
          <div className="col-span-1 md:col-span-2">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Precio de Venta al Público</label>
            <input
              type="text"
              value={formattedSellingPrice}
              readOnly
              className="h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface-container-highest px-4 text-on-surface-variant cursor-not-allowed"
            />
            <p className="text-secondary text-sm mt-1">Calculado automáticamente: Costo + (Costo * % Ganancia)</p>
          </div>

          {/* Descripción */}
          <div className="col-span-1 md:col-span-2">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Descripción (Opcional)</label>
            <textarea
              {...register('description')}
              className={`min-h-[100px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow p-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.description ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="Detalles del servicio…"
            />
            <ErrorMessage message={errors.description?.message} />
          </div>

        </div>

        {/* Divider */}
        <hr className="border-outline-variant/50 border-t my-8" />

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
            disabled={isSubmitting}
            className="cursor-pointer w-full sm:w-auto h-[56px] px-8 rounded-full bg-primary-container text-on-primary-container font-cta text-cta hover:bg-primary-fixed-dim transition-all shadow-sm active:scale-95 duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined">save</span>
            )}
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
