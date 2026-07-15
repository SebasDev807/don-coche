'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/tecnico/Header';
import { RegistrationForm } from '../../components/tecnico/RegistrationForm';
import { ServicesPanel } from '../../components/tecnico/ServicesPanel';
import { useAuthStore } from '@/store/useAuthStore';

export default function TecnicoScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!user || user.role !== 'technical') {
      router.push('/auth');
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  // Prevent flash of content during hydration
  if (!mounted) return null;
  if (!user || user.role !== 'technical') return null;

  return (
    <div className="bg-gray-50 h-screen flex flex-col font-[family-name:var(--font-sora)] overflow-hidden">
      <Header 
        technicianName={user.name} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <RegistrationForm />
        <ServicesPanel />
      </main>
    </div>
  );
}
