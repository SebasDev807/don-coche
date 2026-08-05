/**
 * Tipos TypeScript para la WhatsApp Cloud API (Meta).
 * Referencia: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 */

// ─────────────────────────────────────────────
// TIPOS BASE DEL PAYLOAD
// ─────────────────────────────────────────────

export type WhatsAppMessageType = 'template' | 'text' | 'image';

export type WhatsAppRecipientType = 'individual';

/** Payload raíz que se envía al endpoint de Meta */
export interface WhatsAppMessagePayload {
  messaging_product: 'whatsapp';
  recipient_type: WhatsAppRecipientType;
  to: string; // Número en formato internacional sin '+': "573001234567"
  type: WhatsAppMessageType;
  template?: WhatsAppTemplate;
  text?: WhatsAppText;
}

// ─────────────────────────────────────────────
// MENSAJES DE TEXTO (solo en conversaciones abiertas)
// ─────────────────────────────────────────────

export interface WhatsAppText {
  preview_url?: boolean;
  body: string;
}

// ─────────────────────────────────────────────
// TEMPLATES (requeridos para mensajes de empresa → cliente)
// ─────────────────────────────────────────────

export type WhatsAppLanguageCode = 'es' | 'es_CO' | 'en_US';

export interface WhatsAppTemplate {
  name: string;            // Nombre del template aprobado en Meta
  language: {
    code: WhatsAppLanguageCode;
  };
  components?: WhatsAppComponent[];
}

// ─────────────────────────────────────────────
// COMPONENTES DEL TEMPLATE
// ─────────────────────────────────────────────

export type WhatsAppComponentType = 'header' | 'body' | 'button';
export type WhatsAppButtonSubType = 'quick_reply' | 'url';

export interface WhatsAppComponent {
  type: WhatsAppComponentType;
  sub_type?: WhatsAppButtonSubType; // Solo para type="button"
  index?: string;                   // Solo para type="button" ("0", "1", ...)
  parameters: WhatsAppParameter[];
}

export type WhatsAppParameterType = 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'payload';

export interface WhatsAppParameter {
  type: WhatsAppParameterType;
  text?: string;
  payload?: string; // Para botones quick_reply
  currency?: {
    fallback_value: string;
    code: string; // "COP", "USD"
    amount_1000: number; // Monto * 1000 (ej: $15.000 COP → 15000000)
  };
  date_time?: {
    fallback_value: string;
  };
  document?: {
    link: string;
    filename?: string;
  };
}

// ─────────────────────────────────────────────
// RESPUESTA DE LA API
// ─────────────────────────────────────────────

export interface WhatsAppApiSuccessResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string; // ID del mensaje generado por Meta (wa_id)
    message_status?: string;
  }>;
}

export interface WhatsAppApiErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}

export type WhatsAppApiResponse = WhatsAppApiSuccessResponse | WhatsAppApiErrorResponse;

/** Type guard para detectar respuestas de error */
export function isWhatsAppError(res: WhatsAppApiResponse): res is WhatsAppApiErrorResponse {
  return 'error' in res;
}

// ─────────────────────────────────────────────
// TIPOS INTERNOS DE LA APLICACIÓN
// ─────────────────────────────────────────────

/** Resultado normalizado que retorna nuestro servicio */
export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string; // wa_id retornado por Meta
  error?: string;
}

// ─────────────────────────────────────────────
// TIPOS DEL WEBHOOK
// ─────────────────────────────────────────────

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        statuses?: Array<{
          id: string; // wa_id (messageId)
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          errors?: Array<{ code: number; title: string }>;
        }>;
      };
      field: string;
    }>;
  }>;
}
