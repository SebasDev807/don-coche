'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  type AppNotification,
} from '@/actions/dashboard/notifications.actions';

const CACHED_NOTIFICATIONS_KEY = 'dc_cached_notifications';
const DISMISSED_KEY = 'dc_dismissed_notifications';
const ITEMS_PER_PAGE = 5;

/** Leer notificaciones guardadas en el cache de localStorage */
function getCachedNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CACHED_NOTIFICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as any[];
    return parsed.map((n) => ({
      ...n,
      createdAt: new Date(n.createdAt),
    }));
  } catch {
    return [];
  }
}

/** Guardar notificaciones en el cache de localStorage */
function setCachedNotifications(notifications: AppNotification[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHED_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch {}
}

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
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getCachedNotifications());
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Carga e integración de notificaciones con persistencia
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
      setCachedNotifications(filtered);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (isOpen && !loading) {
      load();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Cálculo de paginación
  const totalPages = Math.max(1, Math.ceil(unreadCount / ITEMS_PER_PAGE));
  const effectivePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (effectivePage - 1) * ITEMS_PER_PAGE;
  const paginatedNotifications = displayNotifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleMarkAsRead = async (notification: AppNotification) => {
    const updated = notifications.map(n => n.id === notification.id ? { ...n, isRead: true } : n);
    setNotifications(updated);
    setCachedNotifications(updated);
    dismissId(notification.id);
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
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    setCachedNotifications(updated);
    dismissAll(allIds);
    markAllNotificationsAsReadAction().catch(console.error);
    setCurrentPage(1);
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
          <div className="flex items-center gap-2">
            <h3 className="font-label-lg font-bold text-on-surface">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-medium">
                {unreadCount}
              </span>
            )}
          </div>
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
              {paginatedNotifications.map((notification) => (
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

        {/* Paginación y Botón Marcar todas como leídas */}
        {unreadCount > 0 && (
          <div className="p-3 border-t border-surface-variant bg-surface-container flex items-center justify-between gap-2 text-body-sm">
            <button
              onClick={handleMarkAllAsRead}
              className="text-primary font-label-md hover:underline transition-all cursor-pointer text-xs font-medium"
            >
              Marcar todas como leídas
            </button>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant font-medium">
                  {effectivePage} de {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={effectivePage === 1}
                    className="p-1 rounded-md text-on-surface hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Página anterior"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={effectivePage === totalPages}
                    className="p-1 rounded-md text-on-surface hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Página siguiente"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
