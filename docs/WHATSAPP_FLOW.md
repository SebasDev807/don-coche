# WhatsApp Cloud API — Flujo de Implementación

> Documento vivo. Se actualiza conforme avanza la implementación de la Fase 4.
> Referencia oficial: https://developers.facebook.com/docs/whatsapp/cloud-api

---

## Estado actual

| Componente | Estado | Notas |
|---|---|---|
| `config/env.ts` | ✅ Listo | Variables validadas con Zod |
| `lib/whatsapp/whatsapp.types.ts` | ✅ Listo | Tipos completos de la Meta API |
| `lib/whatsapp/whatsapp.service.ts` | ✅ Listo | Servicio core + notificaciones de alto nivel |
| `lib/whatsapp/index.ts` | ✅ Listo | Barrel export |
| `app/api/v1/whatsapp/webhook/route.ts` | ✅ Listo | GET verificación + POST status events |
| Integración en `billOrder()` | ✅ Listo | Enviando notificaciones con `after()` |
| Templates aprobados por Meta | ✅ Listo | `don_coche_recibo`, `don_coche_recordatorio_mantenimiento` |
| Log de notificaciones en BD | 🔲 Pendiente | Modelo `WhatsAppNotification` en Prisma |

---

## Arquitectura del Flujo

```
Cliente (browser)
    │  clic en "Facturar"
    ▼
Server Action: billOrder()          [actions/orders/admin.actions.ts]
    │  1. verifyRole()
    │  2. prisma.$transaction() → descuenta inventario
    │  3. order.update() → status: FACTURADA
    │
    ├──► after(() => sendReceiptNotification(order))   ← FIRE-AND-FORGET
    │                                                     (no bloquea la respuesta)
    │
    ▼
Retorna { success: true, data: order } al cliente   ← inmediato

    ... (después de que la respuesta llega al navegador) ...

    ▼
sendReceiptNotification(order)      [lib/whatsapp/whatsapp.service.ts]
    │  Valida que el cliente tenga teléfono
    │  Construye el payload del template
    │
    ▼
sendWhatsAppTemplate(phone, template)
    │  POST https://graph.facebook.com/v21.0/{PHONE_ID}/messages
    │  Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}
    │
    ▼
Meta WhatsApp Cloud API
    │  Entrega el mensaje al cliente
    │  Envía evento de status al webhook
    ▼
Route Handler: GET|POST /api/v1/whatsapp/webhook
    │  GET → responde hub.challenge (verificación inicial)
    │  POST → recibe { status: "delivered" | "read" | "failed" }
    ▼
(futuro) Actualiza WhatsAppNotification en BD
```

---

## Variables de Entorno Requeridas

Agrega estas variables a tu `.env`:

```bash
# Ya configuradas:
WHATSAPP_PHONE_NUMBER_ID=<ID del número en Meta Developer Console>
WHATSAPP_BUSINESS_ACCOUNT_ID=<ID de la cuenta Business>
WHATSAPP_ACCESS_TOKEN=<Token permanente o temporal>

# Pendiente de configurar (cuando registres el webhook en Meta):
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<cualquier_string_secreto_que_tú_elijas>
```

**Dónde obtener cada valor:**
- `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_BUSINESS_ACCOUNT_ID`: Meta for Developers → Tu App → WhatsApp → Configuración de API
- `WHATSAPP_ACCESS_TOKEN`: Token del sistema (permanente) o token de usuario (temporal, 24h)
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: Lo inventas tú — es el token que Meta te enviará de vuelta al verificar el webhook. Puedes usar `openssl rand -base64 32`

---

## Templates de Meta

### ¿Qué es un template?

Meta solo permite que las empresas envíen mensajes a clientes usando templates pre-aprobados (mensaje de empresa → cliente). Los templates se crean en el **Meta Business Suite** y tardan en aprobarse (usualmente 1-3 días).

**Restricción clave**: Los mensajes de texto libre solo están disponibles si el cliente te escribió primero en las últimas 24 horas (ventana de conversación). Para notificaciones proactivas, siempre se usa un template.

### Templates necesarios para esta implementación

#### 1. `don_coche_recibo` — Notificación de facturación
**Categoría**: `UTILITY`  
**Idioma**: `es_CO`

Cuerpo propuesto (variables entre `{{n}}`):
```
Hola {{1}}, tu vehículo de placa {{2}} fue atendido exitosamente en Don Coche. 
Total a pagar: {{3}}. 
¡Gracias por confiar en nosotros! 🚗
```

Variables:
- `{{1}}` → Nombre del cliente
- `{{2}}` → Placa del vehículo  
- `{{3}}` → Total de la factura (formato moneda COP)

#### 2. `don_coche_recordatorio_mantenimiento` — Recordatorio preventivo
**Categoría**: `MARKETING`  
**Idioma**: `es_CO`

Cuerpo propuesto:
```
Hola, tu vehículo {{1}} tiene pendiente su servicio de {{2}}.
¡Agenda tu cita en Don Coche antes de que sea tarde! 🔧
Responde este mensaje para reservar tu espacio.
```

Variables:
- `{{1}}` → Placa del vehículo
- `{{2}}` → Nombre del servicio (ej: "cambio de aceite")

> **¿Cómo crear los templates?**
> Meta Business Suite → WhatsApp → Plantillas de mensajes → Crear plantilla

---

## Cómo Integrar en `billOrder()`

Una vez los templates estén aprobados, agregar en `actions/orders/admin.actions.ts`:

```typescript
// 1. Import al inicio del archivo
import { after } from 'next/server';
import { sendReceiptNotification, type OrderReceiptData } from '@/lib/whatsapp';

// 2. Al final de billOrder(), antes del return:
const receiptData: OrderReceiptData = {
  phone: updatedOrder.vehicle.customer?.phone,
  customerName: updatedOrder.vehicle.customer?.name,
  vehiclePlate: updatedOrder.vehicle.plate,
  orderNumber: updatedOrder.orderNumber,
  grandTotal: Number(updatedOrder.grandTotal),
};

// after() ejecuta la notificación DESPUÉS de que la respuesta llega al cliente
// Si WhatsApp falla, la facturación ya fue confirmada — no se revierten datos
after(() => {
  sendReceiptNotification(receiptData).catch(err =>
    console.error('[billOrder] Error al enviar notificación WhatsApp:', err)
  );
});
```

### ¿Por qué `after()` y no `.catch()` simple?

Con `after()` (función de Next.js 15+), la notificación se ejecuta **después** de que el framework envía la respuesta HTTP al navegador. Esto garantiza:
1. El usuario ve "Facturado" sin esperar la llamada a Meta API
2. La latencia de WhatsApp (100-500ms) no afecta la UX
3. La notificación se completa aunque el componente ya se haya desmontado

---

## Configuración del Webhook en Meta

Cuando se tengan los templates aprobados y el servidor esté accesible públicamente:

1. **Obtener URL pública**: En desarrollo usar `ngrok http 3000` o el túnel de Next.js (`next dev --turbo --experimental-https`)
2. **Registrar en Meta**: Developer Console → Tu App → WhatsApp → Configuración → Webhooks
   - URL: `http://localhost:3000/api/v1/whatsapp/webhook`
   - Verify Token: el valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Suscribir a: `messages` (para recibir status de mensajes)
3. Meta hace un GET a tu endpoint con `hub.challenge` — el Route Handler responde automáticamente

---

## Decisiones de Diseño

### ¿Por qué un Service Layer y no directamente en la Server Action?

- **Reutilizable**: `sendMaintenanceReminder()` puede ser llamado desde un cron job sin duplicar lógica.
- **Testeable**: `sendWhatsAppTemplate()` recibe solo datos puros — fácil de mockear en tests.
- **Sin `'use server'`**: El service layer es JavaScript puro del lado servidor. Puede ser importado en Server Actions, Route Handlers y scripts de Node.js sin restricciones.

### ¿Por qué fire-and-forget y no `await`?

Un fallo de la API de Meta no debe cancelar una facturación exitosa. La transacción de Prisma ya se completó — es un efecto secundario opcional. El patrón con `after()` garantiza que:
- La UX no se degrada por latencia de red de terceros.
- Los errores de WhatsApp son loguados y trackeables, pero no críticos.

---

## Próximos Pasos

1. **Esperar aprobación de templates** en Meta Business Suite
2. **Integrar `after(() => sendReceiptNotification(...))` en `billOrder()`**
3. **Probar con número de sandbox** de Meta antes de usar el número de producción
4. **Registrar el webhook** cuando el dominio de producción esté disponible
5. **(Opcional)** Crear modelo `WhatsAppNotification` en Prisma para trazabilidad
6. **(Futuro)** Implementar recordatorios programados con cron job externo
