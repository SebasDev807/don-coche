'use server';

import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/dal';
import { FeatureType, ReleaseStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getReleases() {
  await verifyRole(['SUPERUSUARIO']);
  
  const releases = await prisma.appRelease.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { name: true }
      },
      features: true
    }
  });

  return releases;
}

export async function getReleaseById(id: string) {
  await verifyRole(['SUPERUSUARIO']);
  
  return await prisma.appRelease.findUnique({
    where: { id },
    include: { features: true }
  });
}

export async function createDraftRelease(data: { version: string, title: string, summary?: string }) {
  const session = await verifyRole(['SUPERUSUARIO']);
  
  try {
    const release = await prisma.appRelease.create({
      data: {
        version: data.version,
        title: data.title,
        summary: data.summary,
        status: 'DRAFT',
        authorId: session.userId,
      }
    });
    revalidatePath('/releases');
    return { success: true, release };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe una actualización con esa versión.' };
    }
    return { success: false, error: 'Error al crear la actualización.' };
  }
}

export async function updateRelease(id: string, data: { version: string, title: string, summary?: string, features: { type: FeatureType, title: string, description?: string }[] }) {
  await verifyRole(['SUPERUSUARIO']);
  
  try {
    const release = await prisma.$transaction(async (tx) => {
      const updated = await tx.appRelease.update({
        where: { id },
        data: {
          version: data.version,
          title: data.title,
          summary: data.summary,
        }
      });

      // Update features: simplest is delete all and recreate
      await tx.releaseFeature.deleteMany({
        where: { releaseId: id }
      });

      if (data.features.length > 0) {
        await tx.releaseFeature.createMany({
          data: data.features.map(f => ({
            releaseId: id,
            type: f.type,
            title: f.title,
            description: f.description,
          }))
        });
      }

      return updated;
    });

    revalidatePath(`/releases/${id}`);
    revalidatePath('/releases');
    return { success: true, release };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe una actualización con esa versión.' };
    }
    return { success: false, error: 'Error al actualizar.' };
  }
}

export async function publishRelease(id: string) {
  await verifyRole(['SUPERUSUARIO']);
  
  try {
    const release = await prisma.appRelease.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    });
    revalidatePath(`/releases/${id}`);
    revalidatePath('/releases');
    return { success: true, release };
  } catch (error) {
    return { success: false, error: 'Error al publicar.' };
  }
}

export async function deleteRelease(id: string) {
  await verifyRole(['SUPERUSUARIO']);
  
  try {
    await prisma.appRelease.delete({
      where: { id }
    });
    revalidatePath('/releases');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al eliminar.' };
  }
}
