import { env } from '@/config/env';
import { prisma } from '@/lib/prisma';
import type {
  WhatsAppMessagePayload,
  WhatsAppTemplate,
  WhatsAppSendResult,
  WhatsAppApiResponse,
  isWhatsAppError,
} from './whatsapp.types';
import { isWhatsAppError as checkError } from './whatsapp.types';

// ─────────────────────────────────────────────
// CONSTANTES DE LA API
// ─────────────────────────────────────────────

const META_API_VERSION = 'v25.0';
const META_API_BASE_URL = 'https://graph.facebook.com';

/**
 * Construye la URL del endpoint de mensajes de Meta.
 * Ejemplo: https://graph.facebook.com/v21.0/123456789/messages
 */
function getMessagesEndpoint(): string {
  return `${META_API_BASE_URL}/${META_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

// ─────────────────────────────────────────────
// FUNCIÓN CORE DE ENVÍO
// ─────────────────────────────────────────────

/**
 * Envía un mensaje de WhatsApp usando la Cloud API de Meta.
 *
 * Esta es la función de bajo nivel — úsala directamente solo si necesitas
 * control total sobre el payload. Para casos concretos, usa las funciones
 * de alto nivel (`sendReceiptNotification`, etc.).
 *
 * @param to - Número de destino en formato internacional sin '+' (ej: "573001234567")
 * @param template - Objeto template de WhatsApp con nombre, idioma y componentes
 * @returns WhatsAppSendResult con success, messageId o error
 */
export async function sendWhatsAppTemplate(
  to: string,
  template: WhatsAppTemplate,
  orderId?: string
): Promise<WhatsAppSendResult> {
  // Normalizar número: remover '+', espacios y caracteres no numéricos
  let normalizedPhone = to.replace(/\D/g, '');

  // Autocompletar el código de país para Colombia si solo tiene 10 dígitos
  if (normalizedPhone.length === 10) {
    normalizedPhone = `57${normalizedPhone}`;
  }

  if (!normalizedPhone || normalizedPhone.length < 10) {
    return {
      success: false,
      error: `Número de teléfono inválido: "${to}"`,
    };
  }

  const payload: WhatsAppMessagePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizedPhone,
    type: 'template',
    template,
  };

  try {
    const response = await fetch(getMessagesEndpoint(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: WhatsAppApiResponse = await response.json();

    if (!response.ok || checkError(data)) {
      const errorMsg = checkError(data)
        ? `[Meta API ${data.error.code}] ${data.error.message}`
        : `HTTP ${response.status}: ${response.statusText}`;

      console.error('[WhatsApp Service] Error al enviar mensaje:', errorMsg);
      return { success: false, error: errorMsg };
    }

    const messageId = data.messages?.[0]?.id;
    console.log(`[WhatsApp Service] Mensaje enviado a ${normalizedPhone} — wa_id: ${messageId}`);

    if (messageId) {
      await prisma.whatsAppNotification.create({
        data: {
          messageId,
          phone: normalizedPhone,
          templateName: template.name,
          status: 'PENDING',
          orderId: orderId ?? null,
        },
      });
    }

    return { success: true, messageId };

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error de red desconocido';
    console.error('[WhatsApp Service] Error de red:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

// ─────────────────────────────────────────────
// NOTIFICACIONES DE ALTO NIVEL
// ─────────────────────────────────────────────

/**
 * Datos mínimos necesarios para enviar la notificación de recibo.
 * Se mapea desde el objeto Order devuelto por billOrder().
 */
export interface OrderReceiptData {
  orderId: string;                    // UUID de la orden
  phone: string | null | undefined;   // Teléfono del cliente
  customerName: string | null | undefined;
  vehiclePlate: string;
  orderNumber: number;
  grandTotal: number;                 // Ya convertido a número (no Decimal)
}

/**
 * Envía una notificación al cliente tras facturar una orden.
 *
 * ⚠️  REQUIERE template aprobado en Meta con el nombre exacto definido abajo.
 *     Por el momento el template está en revisión — esta función retornará
 *     { success: false } sin lanzar excepción hasta que sea aprobado.
 *
 * Flujo de invocación:
 *   billOrder() → after(() => sendReceiptNotification(order))
 *
 * @param order - Datos de la orden facturada
 */
export async function sendReceiptNotification(
  order: OrderReceiptData
): Promise<WhatsAppSendResult> {
  if (!order.phone) {
    console.warn(
      `[WhatsApp Service] Cliente sin teléfono registrado — orden #${order.orderNumber} omitida`
    );
    return { success: false, error: 'Cliente sin teléfono registrado' };
  }

  // TODO: Reemplazar 'don_coche_recibo' con el nombre exacto del template
  //       una vez sea aprobado por Meta.
  const template: WhatsAppTemplate = {
    name: 'don_coche_recibo',
    language: { code: 'es_CO' },
    components: [
      {
        type: 'header',
        parameters: [
          {
            type: 'document',
            document: {
              link: `${env.NEXT_PUBLIC_APP_URL}/api/v1/orders/${order.orderId}/receipt.pdf`,
              filename: `Factura_Orden_${order.orderNumber}.pdf`,
            },
          },
        ],
      },
      {
        type: 'body',
        parameters: [
          { type: 'text', text: order.customerName ?? 'Cliente' },
          { type: 'text', text: order.vehiclePlate },
          { 
            type: 'text', 
            text: `$${order.grandTotal.toLocaleString('es-CO')} COP`
          },
        ],
      },
    ],
  };

  return sendWhatsAppTemplate(order.phone, template, order.orderId);
}

/**
 * Envía un recordatorio de mantenimiento preventivo.
 *
 * ⚠️  REQUIERE template aprobado: 'don_coche_recordatorio_mantenimiento'
 *
 * @param phone - Teléfono del cliente
 * @param vehiclePlate - Placa del vehículo
 * @param serviceName - Nombre del servicio (ej: "Cambio de aceite")
 */
export async function sendMaintenanceReminder(
  phone: string,
  vehiclePlate: string,
  serviceName: string
): Promise<WhatsAppSendResult> {
  const template: WhatsAppTemplate = {
    name: 'don_coche_recordatorio_mantenimiento',
    language: { code: 'es_CO' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: vehiclePlate },
          { type: 'text', text: serviceName },
        ],
      },
    ],
  };

  return sendWhatsAppTemplate(phone, template);
}
