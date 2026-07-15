import { Metadata } from 'next';
import { LoginClient } from '@/components/auth/LoginClient';

export const metadata: Metadata = {
  title: "Don Coche - Iniciar Sesión",
  description: "Inicio de sesión Don Coche",
};

/**
 * Pantalla de inicio de sesión principal de la aplicación Don Coche.
 * 
 * Es un Server Component que aprovecha la exportación de metadata de Next.js
 * y delega la interactividad de la interfaz y los formularios al
 * componente cliente `LoginClient`.
 */
export default function LoginScreen() {
  return <LoginClient />;
}
