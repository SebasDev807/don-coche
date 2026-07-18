/**
 * @fileoverview Componente cliente para la vista de inicio de sesión.
 *
 * Llama al server action `loginAction` que valida las credenciales
 * y crea la cookie de sesión HttpOnly en el servidor.
 * El cliente solo maneja el feedback visual (SweetAlert2) y la redirección.
 *
 * Ya no persiste datos de usuario en el cliente (Zustand eliminado).
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm, SubmitHandler } from 'react-hook-form';
import { PasswordInput, ErrorMessage } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/auth/actions';
import Swal from 'sweetalert2';

type LoginFormInputs = {
  documento: string;
  password: string;
};

/** Roles que redirigen al dashboard de gestión. */
const DASHBOARD_ROLES = ['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR'];

/**
 * Mapea el rol del usuario a una etiqueta legible para SweetAlert2.
 *
 * @param role - Rol del usuario.
 * @returns Etiqueta legible.
 */
function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPERUSUARIO: 'Superusuario',
    GERENTE: 'Gerente',
    ADMINISTRADOR: 'Administrador',
    TECNICO: 'Técnico',
  };
  return labels[role] ?? role;
}

/**
 * Determina la ruta de redirección según el rol del usuario.
 *
 * @param role - Rol del usuario autenticado.
 * @returns Ruta destino.
 */
function getRedirectPath(role: string): string {
  if (role === 'TECNICO') return '/tecnico';
  if (DASHBOARD_ROLES.includes(role)) return '/dashboard';
  return '/auth';
}

/**
 * Componente cliente para la vista de inicio de sesión.
 *
 * Autentica contra la DB vía server action. La sesión se crea en el servidor
 * como cookie HttpOnly — el cliente solo recibe nombre/rol para el feedback.
 */
export function LoginClient() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  /**
   * Envía las credenciales al server action, muestra SweetAlert2
   * y redirige según el rol del usuario.
   */
  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsSubmitting(true);

    try {
      const result = await loginAction(data.documento, data.password);

      if (result.success) {
        // Feedback de bienvenida
        await Swal.fire({
          icon: 'success',
          title: `¡Bienvenido/a!`,
          html: `<strong>${result.user.name}</strong><br/><span style="color:#686000;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">${getRoleLabel(result.user.role)}</span>`,
          confirmButtonColor: '#FFEC00',
          confirmButtonText: 'Continuar',
          color: '#1a1c1c',
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: true,
        });

        // Redirigir según rol (la cookie ya fue creada en el servidor)
        router.push(getRedirectPath(result.user.role));
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error de autenticación',
          text: result.message,
          confirmButtonColor: '#ba1a1a',
          confirmButtonText: 'Entendido',
          color: '#1a1c1c',
        });
      }
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor. Intente de nuevo.',
        confirmButtonColor: '#ba1a1a',
        confirmButtonText: 'Aceptar',
        color: '#1a1c1c',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="antialiased relative min-h-screen bg-white flex flex-col fade-in">
      {/* Header */}
      <header className="w-full flex justify-between items-center p-4 border-b border-outline-variant/30">
        <div className="flex items-center">
          <Image
            src="/images/logo_2.png"
            alt="Logo Secundario"
            width={120}
            height={40}
            className="object-contain"
          />
        </div>
        <button
          className="text-on-surface hover:bg-surface-variant p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
          aria-label="Ayuda"
        >
          <span className="material-symbols-outlined text-2xl">help</span>
        </button>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop bg-surface">

        {/* Login Card */}
        <div className="w-full max-w-[440px] bg-white rounded-lg shadow-sm border border-outline-variant/30 flex flex-col p-stack-lg items-center">

          <Image
            src="/images/logo_1.png"
            alt="Logo Principal"
            width={240}
            height={240}
            className="mb-8 object-contain"
          />

          {/* Header Section */}
          <div className="flex flex-col items-center justify-center mb-stack-md text-center">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-stack-md">
              Iniciar Sesión
            </h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-stack-sm w-full">

            {/* Input Field: Cédula */}
            <div className="relative w-full">
              <label className="block font-label-bold text-label-bold text-on-surface mb-2" htmlFor="documento">
                Número de Cédula (CC)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10 pointer-events-none">
                  badge
                </span>
                <input
                  {...register('documento', {
                    required: 'El número de cédula es obligatorio',
                    pattern: {
                      value: /^[0-9]+$/,
                      message: 'La cédula solo puede contener números',
                    },
                  })}
                  id="documento"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ingrese su cédula"
                  autoComplete="username"
                  disabled={isSubmitting}
                  className="w-full h-touch-target-min pl-12 pr-4 bg-white border border-outline-variant rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim focus:border-primary-fixed-dim transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'white' }}
                />
              </div>
              <ErrorMessage message={errors.documento?.message} />
            </div>

            {/* Input Field: Contraseña */}
            <div className="w-full">
              <PasswordInput
                {...register('password', { required: 'La contraseña es obligatoria' })}
                label="Contraseña"
                id="password"
                placeholder="Ingrese su contraseña"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <ErrorMessage message={errors.password?.message} />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-touch-target-min mt-base bg-primary-container text-on-surface font-cta text-label-bold rounded shadow-sm hover:bg-primary-fixed-dim transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-on-surface" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verificando...
                </>
              ) : (
                'Ingresar al Sistema'
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-stack-sm flex justify-center">
            <a href="#" className="font-body-md text-body-md text-on-secondary-container hover:text-on-surface transition-colors underline underline-offset-4 cursor-pointer">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-outline-variant/30 p-margin-mobile md:px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-label-bold text-on-surface">DON COCHE</span>
          <span className="text-body-md text-on-secondary-container">© 2026 Don Coche. Lavado y servicio de autos</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="text-body-md text-on-secondary-container hover:text-on-surface cursor-pointer">Privacidad</a>
          <a href="#" className="text-body-md text-on-secondary-container hover:text-on-surface cursor-pointer">Términos de Servicio</a>
          <a href="#" className="text-body-md text-on-secondary-container hover:text-on-surface cursor-pointer">Soporte Técnico</a>
        </div>
      </footer>
    </div>
  );
}
