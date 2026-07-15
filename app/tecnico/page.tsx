'use client';

import { useRouter } from 'next/navigation';
import { Header } from '../../components/tecnico/Header';
import { RegistrationForm } from '../../components/tecnico/RegistrationForm';
import { ServicesPanel } from '../../components/tecnico/ServicesPanel';

export default function TecnicoScreen() {
  const router = useRouter();

  // In a real application, we would fetch the current user's data from a context or API.
  // For now, we mock the active technician name.
  const activeTechnicianName = "Técnico #42";

  const handleLogout = () => {
    // In a real app, clear tokens/session here
    router.push('/auth');
  };

  return (
    <div className="bg-gray-50 h-screen flex flex-col font-[family-name:var(--font-sora)] overflow-hidden">
      <Header 
        technicianName={activeTechnicianName} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <RegistrationForm />
        <ServicesPanel />
      </main>
    </div>
  );
}
