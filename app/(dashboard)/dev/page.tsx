import { verifyRole } from '@/lib/dal';
import { DevToolsClient } from '@/components/dashboard/dev/DevToolsClient';

export const metadata = {
  title: 'Opciones de Desarrollo | Don Coche',
};

/**
 * Página de Opciones de Desarrollo.
 * Restringida estrictamente al rol SUPERUSUARIO.
 */
export default async function DevPage() {
  // Verificación adicional de seguridad en el servidor para esta ruta específica.
  await verifyRole(['SUPERUSUARIO']);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-error-container rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-error text-2xl font-bold">code</span>
        </div>
        <div>
          <h1 className="text-2xl font-display-bold text-on-background">Opciones de Desarrollo</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Herramientas destructivas para administración de base de datos.
          </p>
        </div>
      </div>

      <DevToolsClient />
    </div>
  );
}
