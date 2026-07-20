'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { z } from 'zod';
import { createProductSchema, CreateProductFormValues } from '@/validation';
import { updateProduct, getCategories } from '@/actions/inventory';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { InventoryProduct } from './InventoryTable';

const MySwal = withReactContent(Swal);

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
  product: InventoryProduct | null;
}

export function EditProductModal({ isOpen, onClose, onProductUpdated, product }: EditProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof createProductSchema>, any, CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      brand: '',
      category: '',
      stock: 0,
      unitCost: '',
      salePrice: '',
    },
  });

  const formatCurrencyValue = (val: string | number) => {
    const stringVal = val.toString();
    const rawValue = stringVal.replace(/\D/g, '');
    if (!rawValue) return '';
    return new Intl.NumberFormat('es-CO').format(parseInt(rawValue, 10));
  };

  const fetchCategories = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        brand: product.brand || '',
        category: product.categoryId || '',
        stock: product.stock,
        unitCost: formatCurrencyValue(product.unitCost) as any,
        salePrice: formatCurrencyValue(product.salePrice) as any,
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: CreateProductFormValues) => {
    if (!product) return;
    setIsSubmitting(true);

    // Convert string prices to numbers based on schema which uses preprocess to number
    // But schema output is number for unitCost and salePrice.
    // wait, createProductSchema outputs number for unitCost/salePrice.

    const result = await updateProduct({
      id: product.id,
      name: data.name,
      brand: data.brand,
      categoryId: data.category, // Assuming data.category is the ID from the select
      stock: data.stock,
      unitCost: Number(data.unitCost),
      salePrice: Number(data.salePrice),
    });

    setIsSubmitting(false);

    if (result.success) {
      MySwal.fire({
        title: '¡Producto actualizado!',
        text: result.message,
        icon: 'success',
        confirmButtonColor: 'rgba(221, 213, 51, 1)',
        customClass: {
          confirmButton: '!text-black'
        },
        timer: 1500,
        showConfirmButton: false,
      });
      onProductUpdated();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-lg border border-surface-variant overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/50">
          <h2 className="font-title-lg text-title-lg text-on-surface">Editar Producto</h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
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
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Marca</label>
              <input
                {...register('brand')}
                className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.brand ? 'border-error focus:border-error focus:ring-error' : ''}`}
                placeholder="Ej. Mobil"
                type="text"
              />
              <ErrorMessage message={errors.brand?.message} />
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

            <div className="col-span-1">
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Costo Unitario ($)</label>
              <input
                {...register('unitCost')}
                className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.unitCost ? 'border-error focus:border-error focus:ring-error' : ''}`}
                placeholder="0"
                type="text"
                onChange={(e) => {
                  setValue('unitCost', formatCurrencyValue(e.target.value) as any, { shouldValidate: true });
                }}
              />
              <ErrorMessage message={errors.unitCost?.message} />
            </div>

            <div className="col-span-1">
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Precio de Venta ($)</label>
              <input
                {...register('salePrice')}
                className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.salePrice ? 'border-error focus:border-error focus:ring-error' : ''}`}
                placeholder="0"
                type="text"
                onChange={(e) => {
                  setValue('salePrice', formatCurrencyValue(e.target.value) as any, { shouldValidate: true });
                }}
              />
              <ErrorMessage message={errors.salePrice?.message} />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4 pt-6 border-t border-outline-variant/50">
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
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
