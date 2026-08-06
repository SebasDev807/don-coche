/**
 * Datos del negocio para recibos, facturas y documentos oficiales.
 * Actualizar estos valores con la información real del establecimiento.
 */
export const BUSINESS_INFO = {
  name: 'DON COCHE S.A.S.',
  legalName: 'Don Coche Lavadero & Serviteca',
  nit: '902.087.049-6',
  address: 'TV 9 58N 68',
  phone: '310 490 4579',
  email: 'doncochepopayan@gmail.com',
  city: 'Popayán, Cauca',
  tagline: '¡Gracias por su preferencia!',
} as const;

/**
 * Horario laboral del establecimiento para el sistema de citas.
 *
 * Modificar estos valores cuando la clienta confirme el horario real.
 * Todos los componentes de agendamiento leen de aquí.
 */
export const BUSINESS_HOURS = {
  /** Hora de apertura (formato 24h). Ej: 8 = 8:00 AM */
  openHour: 8,
  /** Hora de cierre (formato 24h). Ej: 19 = 7:00 PM */
  closeHour: 19,
  /** Días no laborales (0=Domingo, 1=Lunes, ..., 6=Sábado) */
  closedDays: [0] as readonly number[],
  /** Duración de cada slot de cita en minutos */
  slotDurationMinutes: 60,
} as const;
