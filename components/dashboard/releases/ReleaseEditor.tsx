'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDraftRelease, updateRelease, publishRelease } from '@/actions/releases/admin.actions';
import { FeatureType } from '@prisma/client';

export interface ReleaseFeatureInput {
  type: FeatureType;
  title: string;
  description: string;
}

interface Props {
  initialData?: {
    id: string;
    version: string;
    title: string;
    summary?: string | null;
    status: 'DRAFT' | 'PUBLISHED';
    features: { type: FeatureType; title: string; description?: string | null }[];
  };
}

export function ReleaseEditor({ initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [version, setVersion] = useState(initialData?.version || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [features, setFeatures] = useState<ReleaseFeatureInput[]>(
    initialData?.features.map(f => ({
      type: f.type,
      title: f.title,
      description: f.description || '',
    })) || []
  );

  const isPublished = initialData?.status === 'PUBLISHED';

  const addFeature = () => {
    setFeatures([...features, { type: 'FEATURE', title: '', description: '' }]);
  };

  const updateFeature = (index: number, field: keyof ReleaseFeatureInput, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFeatures(newFeatures);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setError(null);
    try {
      if (initialData) {
        const res = await updateRelease(initialData.id, { version, title, summary, features });
        if (!res.success) setError(res.error || 'Error al actualizar');
        else router.push('/releases');
      } else {
        const res = await createDraftRelease({ version, title, summary });
        if (!res.success) setError(res.error || 'Error al crear');
        else {
          if (features.length > 0 && res.release) {
            await updateRelease(res.release.id, { version, title, summary, features });
          }
          router.push('/releases');
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!initialData) return;
    if (!confirm('¿Estás seguro de publicar esta actualización? Los usuarios serán notificados.')) return;
    
    setLoading(true);
    setError(null);
    try {
      // First save changes
      await updateRelease(initialData.id, { version, title, summary, features });
      // Then publish
      const res = await publishRelease(initialData.id);
      if (!res.success) setError(res.error || 'Error al publicar');
      else router.push('/releases');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl shadow-sm border border-surface-variant max-w-4xl mx-auto flex flex-col gap-6">
      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-xl font-bold">
          {error}
        </div>
      )}

      {isPublished && (
        <div className="p-4 bg-tertiary-container text-on-tertiary-container rounded-xl flex items-center gap-2 font-bold shadow-sm">
          <span className="material-symbols-outlined">campaign</span>
          Esta actualización ya ha sido publicada. Los cambios se guardarán automáticamente, pero la notificación visual no se reenviará.
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <label className="block text-sm font-bold text-on-surface mb-2">Versión (ej. 2.4.0)</label>
          <input
            type="text"
            className="w-full bg-surface-container-low text-on-surface p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary transition-all font-mono"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            disabled={loading}
            placeholder="2.4.0"
          />
        </div>
        <div className="flex-[2]">
          <label className="block text-sm font-bold text-on-surface mb-2">Título de la Actualización</label>
          <input
            type="text"
            className="w-full bg-surface-container-low text-on-surface p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            placeholder="Mejoras en el sistema de inventario"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-on-surface mb-2">Resumen General</label>
        <textarea
          className="w-full bg-surface-container-low text-on-surface p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary transition-all min-h-[100px]"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          disabled={loading}
          placeholder="Un breve resumen de lo que incluye esta versión..."
        />
      </div>

      <div className="border-t border-surface-variant pt-6 mt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-on-surface font-display">Lista de Novedades</h3>
          <button
            onClick={addFeature}
            disabled={loading}
            className="text-primary font-bold flex items-center gap-1 hover:text-primary-container bg-primary/10 px-4 py-1.5 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Agregar
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {features.length === 0 ? (
            <div className="text-center py-8 bg-surface-container-low rounded-3xl border border-dashed border-surface-variant">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">format_list_bulleted_add</span>
              <p className="text-on-surface-variant text-sm font-bold">No has agregado ninguna novedad todavía.</p>
            </div>
          ) : (
            features.map((f, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-4 p-5 bg-surface-container-low rounded-3xl relative group border border-surface-variant shadow-sm hover:border-primary/50 transition-colors">
                <button
                  onClick={() => removeFeature(i)}
                  className="absolute top-4 right-4 text-on-surface-variant hover:text-error transition-colors"
                  title="Eliminar"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
                <div className="w-full md:w-1/4">
                  <select
                    className="w-full bg-surface-container text-on-surface p-3 rounded-xl border-none outline-none font-bold shadow-inner"
                    value={f.type}
                    onChange={(e) => updateFeature(i, 'type', e.target.value)}
                  >
                    <option value="FEATURE">✨ Nueva Funcionalidad</option>
                    <option value="IMPROVEMENT">📈 Mejora</option>
                    <option value="FIX">🐛 Corrección</option>
                    <option value="CHANGE">🔄 Cambio Interno</option>
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Título de la novedad (Ej. Nuevo panel de estadísticas)"
                    className="w-full bg-surface-container-lowest text-on-surface p-3 rounded-xl border border-surface-variant outline-none focus:border-primary font-bold transition-colors"
                    value={f.title}
                    onChange={(e) => updateFeature(i, 'title', e.target.value)}
                  />
                  <textarea
                    placeholder="Descripción detallada (opcional)"
                    className="w-full bg-surface-container-lowest text-on-surface p-3 rounded-xl border border-surface-variant outline-none focus:border-primary text-sm min-h-[80px] transition-colors"
                    value={f.description}
                    onChange={(e) => updateFeature(i, 'description', e.target.value)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 border-t border-surface-variant pt-6 mt-4">
        <button
          onClick={() => router.push('/releases')}
          disabled={loading}
          className="px-6 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSaveDraft}
          disabled={loading || !version || !title}
          className="px-6 py-3 rounded-full font-bold bg-surface-variant text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
        >
          {isPublished ? 'Guardar Cambios' : 'Guardar Borrador'}
        </button>
        {!isPublished && initialData && (
          <button
            onClick={handlePublish}
            disabled={loading || !version || !title}
            className="px-6 py-3 rounded-full font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">rocket_launch</span>
            Publicar Ahora
          </button>
        )}
      </div>
    </div>
  );
}
