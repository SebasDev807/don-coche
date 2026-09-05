'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { z } from 'zod';
import { createProductSchema, CreateProductFormValues } from '@/validation';
import { updateProduct, getCategories } from '@/actions/inventory';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PriceInput } from '@/components/ui/PriceInput';
import { useSellingPrice } from '@/hooks';

const MySwal = withReactContent(Swal);

interface EditProductFormProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    barCode: string | null;
    categoryId: string | null;
    stock: number;
    unitCost: number;
    salePrice: number;
    profitPercentage: number | null;
    iva: number | null;
  };
}

export function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof createProductSchema>, any, CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      barCode: product.barCode || '',
      name: product.name,
      description: product.description || '',
      category: product.categoryId || '',
      stock: product.stock,
      unitCost: new Intl.NumberFormat('es-CO').format(product.unitCost) as any,
      profitPercentage: product.profitPercentage || undefined as unknown as number,
      hasIva: product.iva !== null && product.iva > 0,
      iva: product.iva || 19,
      autoRound: true,
    },
  });

  const unitCostValue = watch('unitCost');
  const profitPercentageValue = watch('profitPercentage');

  // Clean unit cost for calculation if it is formatted
  const numericUnitCost = typeof unitCostValue === 'string'
    ? parseInt(unitCostValue.replace(/\D/g, ''), 10) || 0
    : unitCostValue;

  const ivaValue = watch('iva');
  const hasIvaValue = watch('hasIva');
  const autoRoundValue = watch('autoRound');
  const { formattedSellingPrice } = useSellingPrice(numericUnitCost as number, profitPercentageValue as number, ivaValue as number, hasIvaValue, autoRoundValue);

  const fetchCategories = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmit = async (data: CreateProductFormValues) => {
    setIsSubmitting(true);

    const result = await updateProduct({
      id: product.id,
      name: data.name,
      barCode: data.barCode || undefined,
      description: data.description,
      categoryId: data.category,
      stock: data.stock,
      unitCost: Number(data.unitCost),
      profitPercentage: data.profitPercentage ? Number(data.profitPercentage) : null,
      iva: data.hasIva ? (data.iva ? Number(data.iva) : 19) : 0,
      autoRound: data.autoRound,
    } as any);

    setIsSubmitting(false);

    if (result.success) {
      MySwal.fire({
        title: '¡Producto actualizado!',
        text: result.message,
        icon: 'success',
        confirmButtonColor: 'rgba(221, 213, 51, 1)',
        customClass: {
          confirmButton: '!text-black'
        }
      }).then(() => {
        router.push('/inventario');
        router.refresh();
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-gutter gap-y-6">
          {/* Código de Barras */}
          <div className="col-span-1 md:col-span-2">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Código</label>
            <div className="relative">
              <input
                {...register('barCode')}
                className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow pl-12 pr-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.barCode ? 'border-error focus:border-error focus:ring-error' : ''}`}
                placeholder="Escanea o escribe el código (EAN-13)"
                type="text"
                autoFocus
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-[24px]">barcode</span>
              </div>
            </div>
            <p className="text-secondary text-sm mt-1">Puedes escanear un nuevo código para actualizar el existente.</p>
            <ErrorMessage message={errors.barCode?.message} />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Nombre del Producto</label>
            <input
              {...register('name')}
              className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.name ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="Ej. Aceite Sintético 5W-30"
              type="text"
            />
            <ErrorMessage message={errors.name?.message} />
          </div>

          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Categoría</label>
            <div className="relative">
              <select
                {...register('category')}
                className={`h-[56px] form-select w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 pr-10 text-on-surface appearance-none cursor-pointer ${errors.category ? 'border-error focus:border-error focus:ring-error' : ''}`}
              >
                <option disabled value="">Seleccione una categoría...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </div>
            </div>
            <ErrorMessage message={errors.category?.message} />
          </div>

          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Stock</label>
            <input
              {...register('stock', { valueAsNumber: true })}
              className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.stock ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="0"
              type="number"
              min="0"
            />
            <ErrorMessage message={errors.stock?.message} />
          </div>

          <PriceInput
            name="unitCost"
            label="Costo Unitario ($)"
            register={register}
            setValue={setValue}
            errors={errors}
            placeholder="0"
          />

          {/* Porcentaje de Ganancia */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Porcentaje de Ganancia</label>
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

          {/* IVA */}
          <div className="col-span-1">
            <div className="flex items-center justify-between mb-2">
              <label className="block font-label-bold text-label-bold text-on-surface-variant">IVA [%]</label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-on-surface-variant font-medium">
                <input
                  type="checkbox"
                  {...register('hasIva')}
                  className="w-4 h-4 text-primary bg-surface border-outline-variant rounded focus:ring-primary focus:ring-2"
                />
                Incluir IVA
              </label>
            </div>
            <input
              {...register('iva')}
              type="number"
              min="0"
              max="100"
              step="1"
              disabled={!hasIvaValue}
              className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim disabled:bg-surface-container-highest disabled:text-secondary-fixed-dim ${errors.iva ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="Ej. 19"
            />
            <ErrorMessage message={errors.iva?.message} />
          </div>

          {/* Precio de Venta al Público */}
          <div className="col-span-1">
            <div className="flex items-center justify-between mb-2">
              <label className="block font-label-bold text-label-bold text-on-surface-variant">Precio de Venta (PVP)</label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-on-surface-variant font-medium">
                <input
                  type="checkbox"
                  {...register('autoRound')}
                  className="w-4 h-4 text-primary bg-surface border-outline-variant rounded focus:ring-primary focus:ring-2"
                />
                Redondear a $50
              </label>
            </div>
            <input
              type="text"
              value={formattedSellingPrice}
              readOnly
              className="h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface-container-highest px-4 text-on-surface-variant cursor-not-allowed"
            />
            <p className="text-secondary text-sm mt-1">Calculado automáticamente: Costo + (Costo * % Ganancia)</p>
          </div>

          {/* Descripción del Producto */}
          <div className="col-span-1 md:col-span-2">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Descripción (Opcional)</label>
            <textarea
              {...register('description')}
              className="h-24 form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow p-4 text-on-surface placeholder:text-secondary-fixed-dim resize-none"
              placeholder="Añade detalles sobre el producto..."
            />
          </div>
        </div>

        <hr className="border-outline-variant/50 border-t my-8" />

        <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/inventario')}
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
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
