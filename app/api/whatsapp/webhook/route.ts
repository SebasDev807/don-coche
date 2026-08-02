import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';

// ─────────────────────────────────────────────
// GET — Verificación del Webhook por Meta
// ─────────────────────────────────────────────

/**
 * Meta llama a este endpoint con una petición GET para verificar que
 * somos los dueños del servidor antes de activar el webhook.
 *
 * Parámetros que envía Meta:
 *   ?hub.mode=subscribe
 *   ?hub.verify_token=<nuestro_token>
 *   ?hub.challenge=<string_aleatorio>
 *
 * Si el verify_token coincide, respondemos con hub.challenge para confirmar.
 *
 * Documentación: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Verificación exitosa.');
    // Responder con el challenge en texto plano (Meta lo requiere así)
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn('[WhatsApp Webhook] Verificación fallida — token inválido o modo incorrecto.');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ─────────────────────────────────────────────
// POST — Recibir notificaciones de estado
// ─────────────────────────────────────────────

/**
 * Meta envía eventos a este endpoint cuando el estado de un mensaje cambia:
 *   - sent     → El mensaje fue enviado al servidor de Meta
 *   - delivered → El mensaje llegó al dispositivo del destinatario
 *   - read     → El destinatario leyó el mensaje
 *   - failed   → El envío falló (ej: número inválido, cuenta suspendida)
 *
 * Este endpoint siempre debe responder 200 OK para que Meta no reintente.
 *
 * TODO: Cuando el log de notificaciones en BD esté implementado,
 *       actualizar el estado del registro correspondiente al wa_id recibido.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Log completo del evento para debugging (quitar en producción si hay volumen alto)
  console.log('[WhatsApp Webhook] Evento recibido:', JSON.stringify(body, null, 2));

  // TODO: Validar la firma X-Hub-Signature-256 para seguridad adicional
  // TODO: Procesar cambios de estado y actualizar WhatsAppNotification en BD

  // Siempre responder 200 — Meta reintenta si no recibe una respuesta OK
  return NextResponse.json({ received: true }, { status: 200 });
}
