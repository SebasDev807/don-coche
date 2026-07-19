'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { createProductSchema, CreateProductFormValues } from '@/validation';
import { createProduct, getCategories } from '@/actions/inventory';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const MySwal = withReactContent(Swal);

/**
 * Componente de formulario de cliente para crear un nuevo producto.
 * Valida los datos con react-hook-form y Zod.
 */
export function CreateProductForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);

  // Configuración de react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      brand: '',
      category: undefined,
      stock: 0,
      unitCost: 0,
      salePrice: 0,
    },
  });

  // Cargar las categorías al inicializar el componente
  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await getCategories();
      setCategories(cats);
    };
    fetchCategories();
  }, []);

  /**
   * Manejador del envío del formulario.
   * Llama al Server Action para guardar el producto.
   */
  const onSubmit = async (data: CreateProductFormValues) => {
    setIsSubmitting(true);
    
    // Transformar los datos a FormData para que sean procesados por el Server Action
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value !== undefined && value !== null ? value.toString() : '');
    });

    const result = await createProduct(formData);

    setIsSubmitting(false);

    // Mostrar alerta según el resultado de la creación
    if (result.success) {
      MySwal.fire({
        title: '¡Producto creado!',
        text: result.message,
        icon: 'success',
        confirmButtonColor: 'rgba(221, 213, 51, 1)',
        customClass: {
          confirmButton: '!text-black'
        }
      }).then(() => {
        router.push('/inventario');
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
          
          {/* Nombre del Producto */}
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

          {/* Marca */}
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

          {/* Categoría Dropdown (traídas del servidor) */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Categoría</label>
            <div className="relative">
              <select 
                {...register('category')}
                className={`h-[56px] form-select w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 pr-10 text-on-surface appearance-none cursor-pointer ${errors.category ? 'border-error focus:border-error focus:ring-error' : ''}`}
              >
                <option disabled value="">Seleccione una categoría...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </div>
            </div>
            <ErrorMessage message={errors.category?.message} />
          </div>

          {/* Stock Inicial */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Stock Inicial</label>
            <input 
              {...register('stock', { valueAsNumber: true })}
              className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.stock ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="0" 
              type="number"
              min="0"
            />
            <ErrorMessage message={errors.stock?.message} />
          </div>

          {/* Costo Unitario */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Costo Unitario ($)</label>
            <input 
              {...register('unitCost', { valueAsNumber: true })}
              className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.unitCost ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="0.00" 
              type="number"
              step="0.01"
              min="0"
            />
            <ErrorMessage message={errors.unitCost?.message} />
          </div>

          {/* Precio de Venta */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Precio de Venta ($)</label>
            <input 
              {...register('salePrice', { valueAsNumber: true })}
              className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.salePrice ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="0.00" 
              type="number"
              step="0.01"
              min="0"
            />
            <ErrorMessage message={errors.salePrice?.message} />
          </div>

        </div>

        {/* Divider */}
        <hr className="border-outline-variant/50 border-t my-8" />

        {/* Acciones del formulario */}
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
            Guardar Producto
          </button>
        </div>
      </form>
    </div>
  );
}
