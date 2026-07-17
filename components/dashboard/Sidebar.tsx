/**
 * @fileoverview Sidebar de navegación lateral para el dashboard.
 *
 * Visible solo en pantallas `lg:` y superiores. Muestra el logo,
 * menú de navegación con ítems resaltados según la ruta activa,
 * botón de "Nueva Orden", y accesos a Soporte y Cerrar Sesión.
 *
 * Reutilizable para todas las pantallas del área de gestión
 * (GERENTE / ADMINISTRADOR).
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

/**
 * Definición de un ítem de navegación del sidebar.
 */
interface NavItem {
  /** Identificador Material Symbols del ícono */
  icon: string;
  /** Texto visible del enlace */
  label: string;
  /** Ruta de destino */
  href: string;
}

/** Ítems principales del menú de navegación. */
const NAV_ITEMS: NavItem[] = [
  { icon: 'dashboard',            label: 'Dashboard',             href: '/dashboard' },
  { icon: 'group',                label: 'Gestión de Personal',   href: '/dashboard/personal' },
  { icon: 'inventory_2',          label: 'Inventario Maestro',    href: '/dashboard/inventario' },
  { icon: 'design_services',      label: 'Catálogo de Servicios', href: '/dashboard/servicios' },
  { icon: 'account_balance_wallet', label: 'Cierres de Caja',     href: '/dashboard/cierres' },
];

/**
 * Props del componente Sidebar.
 */
interface SidebarProps {
  /** Callback ejecutado al presionar "Cerrar Sesión". */
  onLogout: () => void;
}

/**
 * Sidebar lateral de escritorio con navegación principal.
 *
 * Usa `usePathname()` para detectar la ruta activa y resaltar
 * el ítem correspondiente con fondo `primary-container`.
 *
 * @param props - {@link SidebarProps}
 */
export function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col h-screen py-8 bg-surface-container-lowest w-72 left-0 top-0 border-r border-surface-variant shrink-0 relative z-20">
      {/* Logo / Branding */}
      <div className="mb-stack-lg flex justify-center px-6">
        <Image
          src="/images/logo_2.png"
          alt="Don Coche Logo"
          width={180}
          height={60}
          priority
          className="object-contain w-auto h-auto"
        />
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 flex flex-col">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-4 px-6 py-4 cursor-pointer group transition-all
                ${
                  isActive
                    ? 'bg-primary-container text-on-surface font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }
              `}
            >
              <span
                className={`material-symbols-outlined group-hover:scale-110 transition-transform ${
                  isActive ? 'fill-icon' : ''
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-label-bold text-label-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: acciones secundarias */}
      <div className="mt-auto px-6 border-t border-surface-variant pt-6 flex flex-col gap-4">
        <button className="w-full bg-primary-container text-on-surface font-cta text-cta py-3 rounded-md tracking-wide hover:bg-primary-fixed-dim transition-colors active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
          <span className="material-symbols-outlined font-bold text-sm">add</span>
          Nueva Orden
        </button>

        <a
          href="#"
          className="flex items-center gap-4 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer group"
        >
          <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">
            support_agent
          </span>
          <span className="font-body-md text-sm">Soporte</span>
        </a>

        <button
          onClick={onLogout}
          className="flex items-center gap-4 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer group w-full"
        >
          <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">
            logout
          </span>
          <span className="font-body-md text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
