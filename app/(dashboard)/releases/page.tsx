import { getReleases } from '@/actions/releases/admin.actions';
import { verifyRole } from '@/lib/dal';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PublishButton } from '@/components/dashboard/releases/PublishButton';

export default async function ReleasesHistoryPage() {
  await verifyRole(['SUPERUSUARIO']);
  const releases = await getReleases();

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8 h-full min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-on-surface">Historial de Novedades</h1>
          <p className="text-on-surface-variant mt-1">Gestiona las actualizaciones y comunicados de la aplicación.</p>
        </div>
        <Link
          href="/releases/new"
          className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-2 rounded-full font-bold shadow-md transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Nueva Versión
        </Link>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-variant bg-surface-container-low text-on-surface-variant text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Versión</th>
                <th className="px-6 py-4 font-semibold">Título</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold">Fecha Publicación</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {releases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                    No hay actualizaciones registradas.
                  </td>
                </tr>
              ) : (
                releases.map((release) => (
                  <tr key={release.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 font-bold font-mono text-primary">{release.version}</td>
                    <td className="px-6 py-4 font-medium text-on-surface">{release.title}</td>
                    <td className="px-6 py-4">
                      {release.status === 'PUBLISHED' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container">
                          Publicada
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-variant text-on-surface-variant">
                          Borrador
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-sm">
                      {release.publishedAt
                        ? format(new Date(release.publishedAt), "dd MMM yyyy", { locale: es })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end items-center gap-3">
                      {release.status === 'DRAFT' && (
                        <PublishButton releaseId={release.id} />
                      )}
                      <Link
                        href={`/releases/${release.id}`}
                        className="text-primary hover:text-primary-container font-medium"
                      >
                        {release.status === 'PUBLISHED' ? 'Ver Detalles' : 'Editar'}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
