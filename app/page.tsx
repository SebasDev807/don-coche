import { redirect } from 'next/navigation';

/**
 * Página raíz de la aplicación.
 * 
 * Actúa como un interceptor inicial que redirige automáticamente a los usuarios
 * a la ruta de autenticación (`/auth`) cuando visitan la raíz del sitio.
 */
export default function Home() {
  redirect('/auth');
}
