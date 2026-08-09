'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  type AppNotification,
} from '@/actions/dashboard/notifications.actions';

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications periodically
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getNotificationsAction();
        if (mounted) {
          setNotifications(data);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    // Carga inicial
    load();
    
    // Polling cada 10 segundos
    const interval = setInterval(load, 10000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (notification: AppNotification) => {
    setIsOpen(false);
    
    if (!notification.isRead) {
      // Actualizar estado local inmediatamente
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, isRead: true } : n
      ));
      
      // Llamar al server action en background
      markNotificationAsReadAction(notification.id).catch(err => {
        console.error('Error marking as read:', err);
      });
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
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
        <div className="p-4 border-b border-surface-variant bg-surface-container">
          <h3 className="font-label-lg font-bold text-on-surface">Notificaciones</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-on-surface-variant font-body-sm animate-pulse">
              Cargando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">done_all</span>
              <p className="font-body-md">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex gap-4 p-4 border-b border-surface-variant last:border-0 hover:bg-surface-variant/50 transition-colors cursor-pointer group"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === 'stock_out' ? 'bg-error-container text-on-error-container' : 
                    notification.type === 'stock_low' ? 'bg-yellow-100 text-yellow-800' : 
                    notification.type === 'appointment_rescheduled' ? 'bg-secondary-container text-on-secondary-container' :
                    notification.type === 'appointment_created' ? 'bg-tertiary-container text-on-tertiary-container' :
                    'bg-primary-container text-on-primary-container'
                  }`}>
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
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-3 border-t border-surface-variant bg-surface-container text-center">
            <button className="text-primary font-label-md hover:underline transition-all">
              Marcar todas como leídas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
