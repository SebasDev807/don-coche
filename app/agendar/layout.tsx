import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Agendar Cita - Don Coche',
  description: 'Agenda tu próxima cita de mantenimiento o lavado en Don Coche',
};

export default function AgendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased overflow-hidden flex flex-col">
      {/* Navbar Minimalista */}
      <header className="bg-surface-container-lowest border-b border-surface-variant sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/images/logo_1.png" 
              alt="Don Coche Logo" 
              width={160} 
              height={40} 
              className="object-contain"
            />
          </div>
          <div className="text-sm font-bold text-on-surface-variant">
            Portal de Clientes
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-surface relative">
        {/* Fondo decorativo premium */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute top-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          {children}
        </div>
      </main>

      {/* Footer Público */}
      <footer className="bg-surface-container-lowest border-t border-surface-variant py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-on-surface-variant text-sm">
          <p>© {new Date().getFullYear()} Don Coche SAS. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
