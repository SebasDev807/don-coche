/**
 * @fileoverview Barra de navegación inferior para dispositivos móviles.
 *
 * Solo visible en pantallas menores a `md:`. Contiene los accesos
 * principales: Inicio, Servicios y Vehículos, usando Material Symbols.
 *
 * Reutilizable para todas las pantallas del área de gestión.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Definición de un ítem del bottom nav móvil.
 */
interface BottomNavItem {
  /** Nombre del ícono Material Symbols. */
  icon: string;
  /** Texto visible debajo del ícono. */
  label: string;
  /** Ruta de destino. */
  href: string;
}

/** Ítems de la barra de navegación inferior. */
const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { icon: 'home_app_logo', label: 'Inicio',    href: '/' },
  { icon: 'minor_crash',   label: 'Servicios', href: '/servicios' },
  { icon: 'directions_car', label: 'Vehículos', href: '/vehiculos' },
];

/**
 * Barra de navegación inferior fija para mobile.
 *
 * Usa `usePathname()` para detectar la ruta activa y resaltar
 * el ítem correspondiente con estilo de pastilla activa.
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden bg-on-surface fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-2 z-50 h-[80px] shadow-lg">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center justify-center p-2 transition-all duration-150
              ${
                isActive
                  ? 'bg-primary-container text-on-primary-container rounded-xl px-6 scale-90'
                  : 'text-on-secondary hover:text-primary-fixed-dim'
              }
            `}
          >
            <span
              className={`material-symbols-outlined text-2xl mb-1 ${isActive ? 'fill-icon' : ''}`}
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="font-label-bold text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
