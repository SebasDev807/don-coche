'use server';

import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/dal';

export async function getLatestPublishedRelease() {
  const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'AUXILIAR_ADMINISTRATIVO', 'TECNICO']);
  
  // Find the most recent PUBLISHED release
  const release = await prisma.appRelease.findFirst({
    where: {
      status: 'PUBLISHED',
    },
    orderBy: {
      publishedAt: 'desc'
    },
    include: {
      features: true
    }
  });

  return release;
}
