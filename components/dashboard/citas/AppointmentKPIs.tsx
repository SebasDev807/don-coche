import type { AppointmentKPIData } from '@/actions/appointments';

/**
 * Propiedades del componente AppointmentKPIs.
 */
interface AppointmentKPIsProps {
  /** Datos agregados para las tarjetas KPI */
  kpis: AppointmentKPIData;
}

/**
 * Definición interna de cada tarjeta KPI.
 */
interface KPICard {
  /** Icono Material Symbols */
  icon: string;
  /** Etiqueta descriptiva */
  label: string;
  /** Valor numérico a mostrar */
  value: number;
  /** Clases de color para el icono y el acento */
  accentClasses: string;
  /** Clases de fondo del contenedor del icono */
  bgClasses: string;
}

/**
 * Tarjetas de indicadores clave (KPI) para la vista de citas.
 *
 * Muestra 4 métricas: citas pendientes, citas de hoy,
 * cumplidas (últimos 7 días) y perdidas (últimos 7 días).
 *
 * @param {AppointmentKPIsProps} props - Datos agregados de citas.
 * @returns {JSX.Element} Grid de tarjetas KPI.
 */
export function AppointmentKPIs({ kpis }: AppointmentKPIsProps) {
  const cards: KPICard[] = [
    {
      icon: 'pending_actions',
      label: 'Pendientes',
      value: kpis.totalPending,
      accentClasses: 'text-amber-600',
      bgClasses: 'bg-amber-50',
    },
    {
      icon: 'today',
      label: 'Hoy',
      value: kpis.todayCount,
      accentClasses: 'text-blue-600',
      bgClasses: 'bg-blue-50',
    },
    {
      icon: 'check_circle',
      label: 'Cumplidas (7d)',
      value: kpis.completedLast7Days,
      accentClasses: 'text-emerald-600',
      bgClasses: 'bg-emerald-50',
    },
    {
      icon: 'cancel',
      label: 'Perdidas (7d)',
      value: kpis.missedLast7Days,
      accentClasses: 'text-red-600',
      bgClasses: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-stack-md">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface-container-lowest border border-surface-container-highest rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div
            className={`w-12 h-12 rounded-xl ${card.bgClasses} flex items-center justify-center shrink-0`}
          >
            <span className={`material-symbols-outlined text-2xl ${card.accentClasses}`}>
              {card.icon}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-md text-headline-md text-on-surface leading-tight">
              {card.value}
            </span>
            <span className="text-xs text-secondary font-medium tracking-wide uppercase">
              {card.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
