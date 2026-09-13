import { verifyRole } from '@/lib/dal';
import { getReleaseById } from '@/actions/releases/admin.actions';
import { ReleaseEditor } from '@/components/dashboard/releases/ReleaseEditor';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditReleasePage({ params }: { params: Promise<{ id: string }> }) {
  await verifyRole(['SUPERUSUARIO']);
  
  const { id } = await params;
  const release = await getReleaseById(id);

  if (!release) {
    notFound();
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link href="/releases" className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-2 rounded-full hover:bg-surface-container-low">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-display text-on-surface">Editar Actualización</h1>
          <p className="text-on-surface-variant mt-1">
            {release.status === 'PUBLISHED' ? 'Modificando un comunicado publicado.' : 'Modificando borrador.'}
          </p>
        </div>
      </div>

      <ReleaseEditor initialData={release} />
    </div>
  );
}
