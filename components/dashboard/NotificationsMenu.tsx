'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  type AppNotification,
} from '@/actions/dashboard/notifications.actions';

const DISMISSED_KEY = 'dc_dismissed_notifications';

/** Leer IDs descartados del localStorage */
function getDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

/** Guardar un ID descartado en localStorage */
function dismissId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const ids = getDismissedIds();
    ids.add(id);
    // Limitar a los últimos 500 para evitar que crezca infinitamente
    const arr = Array.from(ids).slice(-500);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr));
  } catch {}
}

/** Guardar múltiples IDs como descartados */
function dismissAll(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const current = getDismissedIds();
    ids.forEach(id => current.add(id));
    const arr = Array.from(current).slice(-500);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr));
  } catch {}
}

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Función de carga lazy — solo llama al servidor cuando es necesario
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotificationsAction();
      const dismissed = getDismissedIds();
      // Filtrar las notificaciones que el usuario ya descartó localmente
      const filtered = data.map(n =>
        dismissed.has(n.id) ? { ...n, isRead: true } : n
      );
      setNotifications(filtered);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial liviana: solo un fetch del count (para la burbuja del badge)
  // y carga completa solo cuando se abre el menú
  useEffect(() => {
    // Carga inicial para mostrar el badge
    load();
    // Polling cada 60 segundos (no 10, para no saturar)
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  // Lazy load al abrir el dropdown
  useEffect(() => {
    if (isOpen && !loading) {
      load();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cerrar con click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayNotifications = notifications.filter((n) => !n.isRead);
  const unreadCount = displayNotifications.length;

  const handleMarkAsRead = async (notification: AppNotification) => {
    // Optimistic update en UI
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    // Persistir en localStorage para notificaciones dinámicas (stock-*)
    dismissId(notification.id);
    // Persistir en DB para notificaciones persistentes
    markNotificationAsReadAction(notification.id).catch(console.error);
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    setIsOpen(false);
    if (!notification.isRead) {
      handleMarkAsRead(notification);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    const allIds = displayNotifications.map(n => n.id);
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    // Persistir todos en localStorage
    dismissAll(allIds);
    // Persistir en DB (solo las de DB)
    markAllNotificationsAsReadAction().catch(console.error);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-on-surface hover:bg-surface-variant rounded-full transition-colors active:scale-95 cursor-pointer"
        aria-label="Notificaciones"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 bg-error text-on-error text-[10px] font-bold rounded-full border-2 border-surface-container-lowest">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      <div
        className={`absolute right-0 mt-2 w-96 bg-surface-container-lowest rounded-xl shadow-lg border border-surface-variant overflow-hidden z-50 transition-all duration-200 origin-top-right ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="p-4 border-b border-surface-variant bg-surface-container flex items-center justify-between">
          <h3 className="font-label-lg font-bold text-on-surface">Notificaciones</h3>
          {loading && (
            <span className="material-symbols-outlined text-on-surface-variant text-[18px] animate-spin">
              progress_activity
            </span>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && !hasLoaded ? (
            /* Skeleton de carga */
            <div className="flex flex-col">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 p-4 border-b border-surface-variant last:border-0 animate-pulse">
                  <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-surface-variant" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-surface-variant rounded w-3/4" />
                    <div className="h-3 bg-surface-variant rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">done_all</span>
              <p className="font-body-md">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {displayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex gap-4 p-4 border-b border-surface-variant last:border-0 hover:bg-surface-variant/50 transition-colors cursor-pointer group"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div
                    className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      notification.type === 'stock_out' ? 'bg-error-container text-on-error-container' :
                      notification.type === 'stock_low' ? 'bg-yellow-100 text-yellow-800' :
                      notification.type === 'appointment_rescheduled' ? 'bg-secondary-container text-on-secondary-container' :
                      notification.type === 'appointment_created' ? 'bg-tertiary-container text-on-tertiary-container' :
                      'bg-primary-container text-on-primary-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {notification.type === 'stock_out' ? 'block' :
                       notification.type === 'stock_low' ? 'warning' :
                       notification.type === 'appointment_rescheduled' ? 'edit_calendar' :
                       notification.type === 'appointment_created' ? 'event_available' :
                       'notifications'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-lg text-on-surface font-semibold mb-0.5 truncate group-hover:text-primary transition-colors">
                      {notification.title}
                    </p>
                    <p className="font-body-sm text-on-surface-variant line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center pl-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification);
                      }}
                      className="cursor-pointer p-1.5 rounded-full hover:bg-surface-variant text-on-surface-variant hover:text-primary transition-colors"
                      title="Marcar como leída"
                    >
                      <span className="material-symbols-outlined text-[20px]">check</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {displayNotifications.length > 0 && (
          <div className="p-3 border-t border-surface-variant bg-surface-container text-center">
            <button
              onClick={handleMarkAllAsRead}
              className="text-primary font-label-md hover:underline transition-all cursor-pointer"
            >
              Marcar todas como leídas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
