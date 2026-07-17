import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { UpdateStaffForm } from '@/components/dashboard/personal';

export const metadata: Metadata = {
  title: 'Editar Empleado | Don Coche',
  description: 'Formulario para actualizar los datos de un empleado.',
};

interface EditStaffPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditStaffPage(props: EditStaffPageProps) {
  const params = await props.params;
  const { id } = params;

  // Retrieve user from database
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="fade-in max-w-7xl mx-auto flex flex-col gap-8">
      {/* ─── Page Header ─── */}
      <header className="mb-stack-lg max-w-4xl mx-auto w-full">
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">Editar Empleado</h2>
        <p className="font-body-lg text-body-lg text-secondary">Actualice la información del empleado.</p>
      </header>

      {/* ─── Form Section ─── */}
      <section className="w-full">
        <UpdateStaffForm user={user} />
      </section>
    </div>
  );
}
