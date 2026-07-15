"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useForm, SubmitHandler } from 'react-hook-form';
import { PasswordInput, ErrorMessage } from '@/components/ui';
import { MOCK_USERS } from '@/data/mocks';

type LoginFormInputs = {
  documento: string;
  password: string;
};



export default function LoginScreen() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const [loginError, setLoginError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<LoginFormInputs> = (data) => {
    setLoginError(null);
    const user = MOCK_USERS.find(u => u.id === data.documento && u.password === data.password);
    
    if (user) {
      alert(`Bienvenido, ${user.name} (${user.role})`);
    } else {
      setLoginError("Credenciales incorrectas");
    }
  };

  return (
    <div className="antialiased relative min-h-screen bg-white flex flex-col">
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
              <input 
                {...register("documento", { required: "El número de cédula es obligatorio" })}
                id="documento"
                type="text"
                placeholder="Ingrese su cédula"
                autoComplete="username"
                className="w-full h-touch-target-min px-4 bg-white border border-outline-variant rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim focus:border-primary-fixed-dim transition-colors"
                style={{ backgroundColor: 'white' }}
              />
              <ErrorMessage message={errors.documento?.message} />
            </div>

            {/* Input Field: Contraseña */}
            <div className="w-full">
              <PasswordInput 
                {...register("password", { required: "La contraseña es obligatoria" })}
                label="Contraseña"
                id="password"
                placeholder="Ingrese su contraseña"
                autoComplete="current-password"
              />
              <ErrorMessage message={errors.password?.message} />
            </div>
            
            {loginError && (
              <ErrorMessage message={loginError} />
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              className="w-full h-touch-target-min mt-base bg-primary-container text-on-surface font-cta text-label-bold rounded shadow-sm hover:bg-primary-fixed-dim transition-all duration-150 cursor-pointer"
            >
              Ingresar al Sistema
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
