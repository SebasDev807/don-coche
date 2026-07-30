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
import { useSidebarStore } from './useSidebarStore';
import { useEffect, useState } from 'react';
import { getPendingOrdersCount } from '@/actions/orders/admin.actions';

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
  { icon: 'dashboard', label: 'Dashboard', href: '/' },
  { icon: 'point_of_sale', label: 'Panel de Caja', href: '/caja' },
  { icon: 'group', label: 'Gestión de Personal', href: '/personal' },
  { icon: 'inventory_2', label: 'Inventario', href: '/inventario' },
  { icon: 'design_services', label: 'Catálogo de Servicios', href: '/servicios' },
  { icon: 'directions_car', label: 'Clientes y Vehículos', href: '/clientes' },
];

/**
 * Props del componente Sidebar.
 */
interface SidebarProps {
  /** Server Action de logout pasado desde el layout del servidor. */
  logoutAction: () => Promise<never>;
}

/**
 * Sidebar lateral de escritorio con navegación principal.
 *
 * Usa `usePathname()` para detectar la ruta activa y resaltar
 * el ítem correspondiente con fondo `primary-container`.
 * En pantallas pequeñas, se comporta como un panel lateral desplegable.
 *
 * @param props - {@link SidebarProps}
 */
export function Sidebar({ logoutAction }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebarStore();
  const [pendingCajaCount, setPendingCajaCount] = useState(0);

  // Poll para obtener órdenes pendientes en caja
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await getPendingOrdersCount();
        if (res.success) {
          setPendingCajaCount(res.count);
        }
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    };

    // Llamada inicial
    fetchPendingCount();

    // Polling cada 15 segundos
    const intervalId = setInterval(fetchPendingCount, 15000);

    return () => clearInterval(intervalId);
  }, []);

  // Cerrar el sidebar al cambiar de ruta en móviles
  useEffect(() => {
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  return (
    <>
      {/* Overlay (solo visible en mobile cuando está abierto) */}
      {isOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar contenedor */}
      <aside
        className={`
          fixed sm:relative z-50 sm:z-20 top-0 left-0 h-screen w-72 bg-surface-container-lowest 
          border-r border-surface-variant flex flex-col py-8 shrink-0
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full sm:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-center px-6 mb-stack-lg">
          {/* Logo / Branding */}
          <div className="flex justify-center flex-1">
            <Image
              src="/images/logo_1.png"
              alt="Don Coche Logo"
              width={180}
              height={60}
              priority
              className="object-contain w-auto h-auto"
            />
          </div>
        </div>

        {/* Navegación principal */}
        <nav className="flex-1 flex flex-col overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-4 px-6 py-4 cursor-pointer group transition-all
                  ${isActive
                    ? 'bg-primary-container text-black font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                  }
                `}
              >
                <span
                  className={`material-symbols-outlined group-hover:scale-110 transition-transform ${isActive ? 'fill-icon' : ''
                    }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-label-bold text-label-bold">{item.label}</span>
                  {item.href === '/caja' && pendingCajaCount > 0 && (
                    <span className="bg-error text-on-error text-xs font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                      {pendingCajaCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer: acciones secundarias */}
        <div className="mt-auto px-6 border-t border-surface-variant pt-6 flex flex-col gap-4">
          <button className="w-full bg-primary-container text-black font-cta text-cta py-3 rounded-md tracking-wide hover:bg-primary-fixed-dim transition-colors active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
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

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-4 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer group w-full"
            >
              <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">
                logout
              </span>
              <span className="font-body-md text-sm">Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
