import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditServiceForm } from '@/components/dashboard/servicios';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Editar Servicio | Don Coche',
  description: 'Modifica los datos de un servicio existente.',
};

export default async function EditServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const service = await prisma.serviceCatalog.findUnique({
    where: { id: resolvedParams.slug },
  });

  if (!service) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-6 md:p-8">
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-4">Editar Servicio</h1>
      <EditServiceForm 
        id={service.id}
        defaultValues={{
          name: service.name,
          category: service.category as any, // Cast ItemCategory
          basePrice: Number(service.basePrice),
          profitPercentage: service.profitPercentage || undefined,
          description: service.description || undefined,
        }} 
      />
    </div>
  );
}
