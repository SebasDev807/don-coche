'use server';

import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/dal';

export async function getUnreadReleases() {
  const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'TECNICO']);
  
  // Find all PUBLISHED releases that don't have a view from this user
  const releases = await prisma.appRelease.findMany({
    where: {
      status: 'PUBLISHED',
      views: {
        none: {
          userId: session.userId
        }
      }
    },
    orderBy: {
      publishedAt: 'desc' // Most recent first
    },
    include: {
      features: true
    }
  });

  return releases;
}

export async function markReleaseAsViewed(releaseId: string) {
  const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR', 'TECNICO']);
  
  try {
    await prisma.releaseView.create({
      data: {
        userId: session.userId,
        releaseId,
      }
    });
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Already viewed
      return { success: true };
    }
    return { success: false, error: 'Error al marcar como leída.' };
  }
}
