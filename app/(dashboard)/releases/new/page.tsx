import { verifyRole } from '@/lib/dal';
import { ReleaseEditor } from '@/components/dashboard/releases/ReleaseEditor';
import Link from 'next/link';

export default async function NewReleasePage() {
  await verifyRole(['SUPERUSUARIO']);

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link href="/releases" className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-2 rounded-full hover:bg-surface-container-low">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-display text-on-surface">Nueva Actualización</h1>
          <p className="text-on-surface-variant mt-1">Crea un nuevo comunicado para los usuarios.</p>
        </div>
      </div>

      <ReleaseEditor />
    </div>
  );
}
