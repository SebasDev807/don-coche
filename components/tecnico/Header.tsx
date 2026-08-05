import Image from 'next/image';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface HeaderProps {
  technicianName: string;
  logoutAction: () => Promise<never>;
  userDepartment?: string | null;
}

export const Header = ({ technicianName, logoutAction, userDepartment }: HeaderProps) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="bg-surface-container-lowest border-b border-surface-variant px-6 py-4 flex justify-between items-center" data-purpose="main-header">
      <div className="flex items-center gap-4">
        <Image src="/images/logo_1.png" alt="Don Coche Logo" width={150} height={50} className="object-contain" />
      </div>
      <div className="flex items-center gap-6">
        {userDepartment && (
          <div className="hidden md:flex items-center gap-2 text-on-surface-variant text-sm font-medium border-r border-surface-variant pr-4">
            <span className="material-symbols-outlined text-[18px]">location_on</span>
            <span className="capitalize">{userDepartment.toLowerCase()}</span>
            <span className="mx-1">•</span>
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            <span suppressHydrationWarning>{formattedDate}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-on-surface-variant text-sm font-medium cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          Técnico Activo: {technicianName}
        </div>
        <ThemeToggle />
        <form action={logoutAction}>
          <button 
            type="submit"
            className="flex items-center gap-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-medium py-2 px-4 rounded-lg transition-colors text-sm cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Cerrar Sesión
          </button>
        </form>
      </div>
    </header>
  );
};
