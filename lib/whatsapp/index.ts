/**
 * Barrel export del módulo WhatsApp.
 *
 * Importa desde aquí en lugar de los archivos individuales:
 * import { sendReceiptNotification } from '@/lib/whatsapp';
 */

export type {
  WhatsAppSendResult,
  WhatsAppTemplate,
  WhatsAppComponent,
  WhatsAppParameter,
} from './whatsapp.types';

export type { OrderReceiptData } from './whatsapp.service';

export {
  sendWhatsAppTemplate,
  sendReceiptNotification,
  sendMaintenanceReminder,
  sendNextAppointmentNotification,
  sendServiceReminderNotification,
  sendExpiredAppointmentNotification,
} from './whatsapp.service';

