"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSupplierAction } from "@/actions/suppliers/suppliers.actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Definimos el esquema de validación con Zod
const supplierSchema = z.object({
  nit: z.string().min(1, "El NIT / RUT es requerido").max(20, "El NIT es muy largo"),
  name: z.string().min(3, "La razón social debe tener al menos 3 caracteres").max(100, "La razón social es muy larga"),
  phone: z.string().max(20, "El teléfono es muy largo").optional().or(z.literal('')),
  email: z.string().email("Debe ser un correo electrónico válido").optional().or(z.literal('')),
});

// Inferimos el tipo de datos a partir del esquema
type SupplierFormData = z.infer<typeof supplierSchema>;

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSupplierModal({ isOpen, onClose }: CreateSupplierModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      nit: "",
      name: "",
      phone: "",
      email: "",
    }
  });

  if (!isOpen) return null;

  const handleClose = () => {
    reset(); // Limpiar el formulario al cerrar
    onClose();
  };

  const onSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);
    
    // Convertir strings vacíos a undefined para que Prisma no guarde strings vacíos en lugar de nulos
    const sanitizedData = {
      nit: data.nit,
      name: data.name,
      phone: data.phone === "" ? undefined : data.phone,
      email: data.email === "" ? undefined : data.email,
    };

    const result = await createSupplierAction(sanitizedData);

    setIsSubmitting(false);

    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: 'Proveedor Creado',
        text: 'El proveedor ha sido registrado exitosamente.',
        confirmButtonColor: '#ffc107',
      });
      handleClose();
      router.refresh(); // Refrescar la página actual para cargar el nuevo proveedor
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: result.error || 'Ocurrió un error inesperado al crear el proveedor.',
        confirmButtonColor: '#ffc107',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in">
      <div className="bg-surface rounded-3xl p-8 max-w-md w-full shadow-lg">
        <h2 className="text-headline-sm mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[28px]">domain_add</span>
          Nuevo Proveedor
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* NIT / RUT */}
          <div>
            <label htmlFor="nit" className="block text-body-sm text-secondary mb-1">NIT / RUT *</label>
            <input
              id="nit"
              type="text"
              placeholder="Ej. 900123456-1"
              {...register("nit")}
              className={`w-full bg-surface-container p-3 rounded-xl border ${errors.nit ? 'border-error' : 'border-outline-variant'} focus:border-primary focus:outline-none transition-colors`}
            />
            {errors.nit && <p className="text-error text-body-sm mt-1">{errors.nit.message}</p>}
          </div>

          {/* Razón Social */}
          <div>
            <label htmlFor="name" className="block text-body-sm text-secondary mb-1">Razón Social *</label>
            <input
              id="name"
              type="text"
              placeholder="Ej. Repuestos El Coche S.A.S."
              {...register("name")}
              className={`w-full bg-surface-container p-3 rounded-xl border ${errors.name ? 'border-error' : 'border-outline-variant'} focus:border-primary focus:outline-none transition-colors`}
            />
            {errors.name && <p className="text-error text-body-sm mt-1">{errors.name.message}</p>}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="phone" className="block text-body-sm text-secondary mb-1">Teléfono (Opcional)</label>
            <input
              id="phone"
              type="text"
              placeholder="Ej. 300 123 4567"
              {...register("phone")}
              className={`w-full bg-surface-container p-3 rounded-xl border ${errors.phone ? 'border-error' : 'border-outline-variant'} focus:border-primary focus:outline-none transition-colors`}
            />
            {errors.phone && <p className="text-error text-body-sm mt-1">{errors.phone.message}</p>}
          </div>

          {/* Correo Electrónico */}
          <div>
            <label htmlFor="email" className="block text-body-sm text-secondary mb-1">Correo Electrónico (Opcional)</label>
            <input
              id="email"
              type="email"
              placeholder="Ej. contacto@empresa.com"
              {...register("email")}
              className={`w-full bg-surface-container p-3 rounded-xl border ${errors.email ? 'border-error' : 'border-outline-variant'} focus:border-primary focus:outline-none transition-colors`}
            />
            {errors.email && <p className="text-error text-body-sm mt-1">{errors.email.message}</p>}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-outline-variant/50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full text-secondary font-medium hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-primary-fixed text-black font-bold hover:brightness-95 transition-colors disabled:opacity-50 cursor-pointer min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
                  Guardando...
                </>
              ) : (
                <>Guardar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
