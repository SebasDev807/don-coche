'use client';

import { useState } from 'react';
import { publishRelease } from '@/actions/releases/admin.actions';

export function PublishButton({ releaseId }: { releaseId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!confirm('¿Estás seguro de publicar esta versión? Todos los usuarios verán el anuncio.')) return;
    
    setLoading(true);
    await publishRelease(releaseId);
    setLoading(false);
  };

  return (
    <button
      onClick={handlePublish}
      disabled={loading}
      className="text-primary-container bg-primary px-3 py-1 rounded-full text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {loading ? '...' : 'Publicar'}
    </button>
  );
}
