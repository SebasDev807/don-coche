'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { createUserSchema, CreateUserFormValues } from '@/validation';
import { createStaffUser } from '@/actions/personal';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const MySwal = withReactContent(Swal);

export function CreateStaffForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      cc: '',
      name: '',
      email: '',
      celular: '',
      role: 'TECNICO', // or empty, but zod might complain if not matched
      department: '',
      password: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: CreateUserFormValues) => {
    setIsSubmitting(true);
    
    // Create FormData for the server action
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value || '');
    });

    const result = await createStaffUser(formData);

    setIsSubmitting(false);

    if (result.success) {
      MySwal.fire({
        title: '¡Empleado creado!',
        text: result.message,
        icon: 'success',
        confirmButtonColor: 'rgba(221, 213, 51, 1)',
        customClass: {
          confirmButton: '!text-black'
        }
      }).then(() => {
        router.push('/personal');
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
        {/* Grid Layout for Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-gutter gap-y-6">
          
          {/* Cédula */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Número de Cédula (CC)</label>
            <input 
              {...register('cc')}
              className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.cc ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="Ej. 1023456789" 
              type="text"
            />
            <ErrorMessage message={errors.cc?.message} />
          </div>

          {/* Nombre Completo */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Nombre Completo</label>
            <input 
              {...register('name')}
              className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.name ? 'border-error focus:border-error focus:ring-error' : ''}`}
              placeholder="Nombres y Apellidos" 
              type="text"
            />
            <ErrorMessage message={errors.name?.message} />
          </div>

          {/* Correo Electrónico */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <input 
                {...register('email')}
                className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow pl-11 pr-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.email ? 'border-error focus:border-error focus:ring-error' : ''}`}
                placeholder="correo@empresa.com" 
                type="email"
              />
            </div>
            <ErrorMessage message={errors.email?.message} />
          </div>

          {/* Teléfono */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Número de Celular</label>
            <div className="flex">
              <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-outline-variant bg-surface-container-low text-secondary font-medium">
                +57
              </span>
              <input 
                {...register('celular')}
                className={`h-[56px] form-input flex-1 min-w-0 rounded-none rounded-r-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 text-on-surface placeholder:text-secondary-fixed-dim ${errors.celular ? 'border-error focus:border-error focus:ring-error' : ''}`}
                placeholder="300 000 0000" 
                type="tel"
              />
            </div>
            <ErrorMessage message={errors.celular?.message} />
          </div>

          {/* Rol Dropdown */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Rol Asignado</label>
            <div className="relative">
              <select 
                {...register('role')}
                className={`h-[56px] form-select w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 pr-10 text-on-surface appearance-none cursor-pointer ${errors.role ? 'border-error focus:border-error focus:ring-error' : ''}`}
              >
                <option disabled value="">Seleccione un rol...</option>
                <option value="TECNICO">Técnico</option>
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="GERENTE">Gerente</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </div>
            </div>
            <ErrorMessage message={errors.role?.message} />
          </div>

          {/* Departamento Dropdown (Only for Técnicos) */}
          {selectedRole === 'TECNICO' && (
            <div className="col-span-1">
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Departamento (Opcional)</label>
              <div className="relative">
                <select 
                  {...register('department')}
                  className={`h-[56px] form-select w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 pr-10 text-on-surface appearance-none cursor-pointer ${errors.department ? 'border-error focus:border-error focus:ring-error' : ''}`}
                >
                  <option value="">Ambos (Lavadero y Serviteca)</option>
                  <option value="LAVADERO">Lavadero</option>
                  <option value="SERVITECA">Serviteca</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-secondary">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
              <ErrorMessage message={errors.department?.message} />
            </div>
          )}

          {/* Contraseña */}
          <div className="col-span-1">
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Contraseña</label>
            <div className="relative">
              <input 
                {...register('password')}
                className={`h-[56px] form-input w-full rounded-lg border-outline-variant bg-surface focus:border-primary focus:ring-primary focus:ring-2 transition-shadow px-4 pr-12 text-on-surface placeholder:text-secondary-fixed-dim ${errors.password ? 'border-error focus:border-error focus:ring-error' : ''}`}
                id="passwordInput" 
                placeholder="••••••••" 
                type={showPassword ? 'text' : 'password'}
              />
              <button 
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-secondary hover:text-on-surface transition-colors focus:outline-none cursor-pointer" 
                onClick={() => setShowPassword(!showPassword)} 
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]" id="visibilityIcon">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <p className="text-xs text-secondary mt-2">Mínimo 8 caracteres, incluir números y letras.</p>
            <ErrorMessage message={errors.password?.message} />
          </div>

        </div>

        {/* Divider */}
        <hr className="border-outline-variant/50 border-t my-8" />

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4">
          <button 
            type="button"
            onClick={() => router.push('/personal')}
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
            Guardar Empleado
          </button>
        </div>
      </form>
    </div>
  );
}
