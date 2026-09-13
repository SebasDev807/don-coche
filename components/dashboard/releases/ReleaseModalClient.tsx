'use client';

import { useState, useEffect } from 'react';
import { markReleaseAsViewed } from '@/actions/releases/user.actions';
import { FeatureType } from '@prisma/client';

interface ReleaseData {
  id: string;
  version: string;
  title: string;
  summary: string | null;
  features: { id: string; type: FeatureType; title: string; description: string | null }[];
}

interface Props {
  unreadReleases: ReleaseData[];
}

const TYPE_CONFIG = {
  FEATURE: { icon: '✨', label: 'Nueva Funcionalidad', color: 'bg-primary-container text-on-primary-container' },
  IMPROVEMENT: { icon: '📈', label: 'Mejora', color: 'bg-secondary-container text-on-secondary-container' },
  FIX: { icon: '🐛', label: 'Corrección', color: 'bg-error-container text-on-error-container' },
  CHANGE: { icon: '🔄', label: 'Cambio Interno', color: 'bg-tertiary-container text-on-tertiary-container' },
};

export function ReleaseModalClient({ unreadReleases }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (unreadReleases.length > 0) {
      setIsOpen(true);
    }
  }, [unreadReleases]);

  if (!isOpen || unreadReleases.length === 0) return null;

  const release = unreadReleases[currentIndex];

  const handleClose = async () => {
    // Mark current as read
    await markReleaseAsViewed(release.id);

    if (currentIndex < unreadReleases.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-tertiary p-8 text-on-primary relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -top-10 opacity-20">
            <span className="material-symbols-outlined text-[150px]">rocket_launch</span>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
                Versión {release.version}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
                Novedades
              </span>
            </div>
            <h2 className="text-3xl font-display font-bold mt-2">{release.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 flex flex-col gap-6">
          {release.summary && (
            <p className="text-on-surface text-lg leading-relaxed font-medium">
              {release.summary}
            </p>
          )}

          <div className="flex flex-col gap-4 mt-2">
            {release.features.map(f => {
              const config = TYPE_CONFIG[f.type];
              return (
                <div key={f.id} className="flex gap-4 p-4 rounded-2xl bg-surface-container-low border border-surface-variant hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl shadow-sm ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {config.label}
                    </span>
                    <h4 className="font-bold text-on-surface text-lg leading-tight">{f.title}</h4>
                    {f.description && (
                      <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                        {f.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-variant flex justify-between items-center bg-surface-container-lowest shrink-0">
          <div className="text-sm font-bold text-on-surface-variant">
            {unreadReleases.length > 1 ? `Actualización ${currentIndex + 1} de ${unreadReleases.length}` : ''}
          </div>
          <button
            onClick={handleClose}
            className="px-8 py-3 rounded-full font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            {currentIndex < unreadReleases.length - 1 ? 'Siguiente' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
}
