# 🧾 Integración de Facturación Electrónica con Aliaddo

Documentación técnica de la integración entre **Don Coche App** y **Aliaddo** para la emisión de facturas electrónicas ante la DIAN de Colombia.

---

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Credenciales y Variables de Entorno](#credenciales-y-variables-de-entorno)
3. [Flujo Completo de Facturación](#flujo-completo-de-facturación)
4. [Servicio de Aliaddo (TypeScript)](#servicio-de-aliaddo)
5. [Sincronización de Servicios](#sincronización-de-servicios)
6. [Cómo el Cliente Ve la Factura](#cómo-el-cliente-ve-la-factura)
7. [Base de Datos (Prisma)](#base-de-datos-prisma)
8. [Scripts de Mantenimiento](#scripts-de-mantenimiento)
9. [Pendientes con el Contador](#pendientes-con-el-contador)
10. [Errores Comunes y Soluciones](#errores-comunes-y-soluciones)

---

## Arquitectura General

```
Don Coche App (Next.js)
        │
        │  1. Cajero cobra una orden
        ▼
 billOrder() [Server Action]
        │
        │  2. Actualiza la orden en PostgreSQL (FACTURADA)
        │  3. Descuenta inventario
        │
        │  4. Construye el payload de factura
        ▼
 AliaddoService.createInvoice()
        │
        │  POST https://app.aliaddo.net/v1/invoices
        ▼
    Aliaddo API
        │
        │  5. Aliaddo firma el XML y lo envía a la DIAN
        ▼
      DIAN
        │
        │  6. Retorna CUFE (Código Único de Facturación Electrónica)
        ▼
 Don Coche guarda el CUFE en la BD
        │
        │  7. El cajero ve el botón "Ver en Catálogo DIAN"
        ▼
 catalogo-vpfe.dian.gov.co
        │
        │  8. El cliente puede descargar el PDF oficial
        ▼
    PDF Firmado DIAN ✅
```

---

## Credenciales y Variables de Entorno

Archivo: `.env`

```env
# Aliaddo - Facturación Electrónica
ALIADDO_API_URL=https://app.aliaddo.net/v1
ALIADDO_API_KEY=eyJhbGci...  # Token JWT generado en Aliaddo → Mis datos
```

### Cómo obtener/renovar el token

1. Ingresar a [app.aliaddo.net](https://app.aliaddo.net)
2. Clic en el nombre de usuario (esquina superior derecha)
3. Seleccionar **"Mis datos"**
4. Generar nuevo token en la sección de API

> ⚠️ El token JWT de Aliaddo puede tener vencimiento. Si las facturas empiezan a fallar con error 401, renovar el token aquí.

---

## Flujo Completo de Facturación

### Paso 1 — El cajero cobra la orden

El cajero selecciona el método de pago (Efectivo, Tarjeta o Transferencia) en la pantalla `/caja/[id]`.

### Paso 2 — Server Action `billOrder`

Archivo: `actions/orders/admin.actions.ts`

```typescript
// Mapeo de método de pago a código Aliaddo
const paymentMeanCode = isCard ? '48' : (isTransfer ? '47' : '10');
//                       Tarjeta     Transferencia   Efectivo
```

### Paso 3 — Construcción del Payload

Cada servicio de la orden se mapea usando su `aliaddoItemCode` (sincronizado previamente):

```typescript
const details = [
  ...updatedOrder.services.map(s => ({
    unitValueBeforeTax: Number(s.chargedPrice),
    quantity: 1,
    description: s.service?.name,           // "Lavado Completo"
    itemCode: s.service?.aliaddoItemCode,    // "LAVACOMP6FFC"
    discountAmount: 0,
    discountIsPercent: true
  }))
];
```

### Paso 4 — Envío a Aliaddo

```typescript
const invoicePayload = {
  date: localDate,            // Fecha Colombia (YYYY-MM-DD)
  dueDate: localDate,
  paymentFormCode: 'CR',      // Crédito/Contado
  paymentMeanCode,            // 10=Efectivo, 48=Tarjeta, 47=Transferencia
  currencyCode: 'COP',
  personId: '...',            // ID del cliente en Aliaddo
  branchId: '...',            // ID de sucursal en Aliaddo
  details,
};

const aliaddoResponse = await AliaddoService.createInvoice(invoicePayload);
```

### Paso 5 — Respuesta de Aliaddo

Aliaddo retorna el objeto de la factura con:

| Campo | Descripción |
|---|---|
| `id` | UUID de la factura en Aliaddo |
| `consecutive` | Número consecutivo (Ej: `FEDC-7`) |
| `cufe` | Código único DIAN (96 chars hex) |
| `qr` | String con datos del QR verificable |
| `stateDian` | `"Valida"` si la DIAN la aprobó |

### Paso 6 — Guardado en Base de Datos

```typescript
await prisma.order.update({
  where: { id: updatedOrder.id },
  data: {
    aliaddoInvoiceId: aliaddoResponse.id,
    cufe: aliaddoResponse.cufe,
  }
});
```

### Paso 7 — El cajero ve el modal con el botón DIAN

El `ReceiptModal` detecta si hay `cufe` y muestra el botón verde:

```tsx
{order.cufe && (
  <button onClick={() => {
    const url = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${order.cufe}`;
    window.open(url, '_blank');
  }}>
    Ver en Catálogo DIAN (FEDC-7)
  </button>
)}
```

### Paso 8 — El portal DIAN

Al abrir el link del catálogo, la DIAN solicita:
- **CUFE o UUID**: ya viene prellenado en la URL
- **NIT del Emisor o Receptor**: `902087049` (NIT de Don Coche SAS)

El PDF está protegido con contraseña = **NIT del receptor** (sin puntos ni DV).

---

## Servicio de Aliaddo

Archivo: `lib/services/aliaddo.ts`

```typescript
export class AliaddoService {
  // Crea una factura electrónica → POST /v1/invoices
  static async createInvoice(payload): Promise<AliaddoInvoiceResponse>

  // Consulta una factura por ID → GET /v1/invoices/{id}
  static async getInvoice(invoiceId: string): Promise<AliaddoInvoiceResponse>

  // Construye la URL del catálogo DIAN a partir del CUFE
  static buildDianViewerUrl(cufe: string): string
}
```

### IDs Fijos Configurados

| Campo | ID | Descripción |
|---|---|---|
| `personId` | `1b117033-c258-4b88-b59c-f137fa3a316d` | Don Coche SAS en Aliaddo |
| `branchId` | `8ffca1e5-8f58-11f1-8ea2-42010a26ccd5` | Sucursal Principal |

> ⚠️ Estos IDs son temporales para pruebas. En producción, el `personId` debe corresponder al cliente real de la orden.

---

## Sincronización de Servicios

Los servicios de Don Coche se crean en el catálogo de ítems de Aliaddo para que aparezcan con su nombre real en la factura DIAN.

### Estado actual (19 servicios sincronizados)

| Servicio en Don Coche | Código en Aliaddo |
|---|---|
| Aspirado Interior | `ASPIINTE` |
| Cambio de bomba de agua | `CAMBDEBOMBDEAGUA` |
| Cambio de embrague | `CAMBDEEMBR` |
| Cambio de kit de distribución | `CAMBDEKITDEDIST` |
| Cambio de líquido de dirección hidráulica | `CAMBDELQUIDEDIREHIDR` |
| Desmanchado de tapiceria | `DESMDETAPIAD9E` |
| Detailling completo | `DETACOMPE3DD` |
| Diagnóstico eléctrico automotriz | `DIAGELCTAUTO087A` |
| Encerado Manual | `ENCEMANUF4EB` |
| Lavado Completo | `LAVACOMP6FFC` |
| Lavado de chasis | `LAVADECHAS62B3` |
| Lavado de motor | `LAVADEMOTO66CF` |
| Lavado exterior básico | `LAVAEXTEBSIC7CEB` |
| Lavado premium con cera | `LAVAPREMCONCERA3C6B` |
| Limpieza del cuerpo de aceleración | `LIMPDELCUERDEACEL332` |
| Montaje y desmontaje de llanta | `MONTYDESMDELLAN388F` |
| Polinchado basico | `POLIBASIACBA` |
| Recarga de aire acondicionado | `RECADEAIREACONAD98` |
| Reparación de pinchazo | `REPADEPINC4238` |

El código se guarda en el campo `aliaddoItemCode` de la tabla `service_catalog`.

---

## Cómo el Cliente Ve la Factura

### Flujo visual del cajero

```
[Pantalla /caja/[id]]
    ↓ Clic en "Cobrar" (Efectivo / Tarjeta / Transferencia)
[Modal de confirmación]
    ↓ Confirmar
[Modal de Recibo POS]
    ├── Muestra el recibo interno imprimible
    ├── Botón "Imprimir Recibo" → impresora POS (80mm)
    └── Botón VERDE "Ver en Catálogo DIAN (FEDC-X)" → abre el PDF oficial
```

### Portal DIAN

```
https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey={CUFE}
    ↓
Ingresa NIT: 902087049
    ↓
Descarga PDF con:
  - Logo DIAN
  - CUFE y código QR verificable
  - Datos del emisor (Don Coche SAS)
  - Detalle de servicios prestados
  - Total en COP
  - Número de autorización DIAN
```

---

## Base de Datos (Prisma)

### Campos agregados en la tabla `orders`

```prisma
model Order {
  // ... campos existentes ...
  aliaddoInvoiceId  String?  @map("aliaddo_invoice_id")  // UUID de Aliaddo
  cufe              String?                               // CUFE de la DIAN
}
```

### Campo agregado en `service_catalog`

```prisma
model ServiceCatalog {
  // ... campos existentes ...
  aliaddoItemCode  String?  @map("aliaddo_item_code")  // Código en Aliaddo
}
```

---

## Scripts de Mantenimiento

Todos los scripts están en la carpeta `scripts/`:

### `sync-services-to-aliaddo.ts`
Crea en Aliaddo los servicios que aún no están sincronizados.

```bash
npx tsx scripts/sync-services-to-aliaddo.ts
```

- ✅ **Idempotente**: si el servicio ya tiene `aliaddoItemCode`, lo salta
- Útil cuando se agregan nuevos servicios a Don Coche

### `fix-aliaddo-codes.ts`
Repara los `aliaddoItemCode` en la BD haciendo match por nombre con el catálogo de Aliaddo.

```bash
npx tsx scripts/fix-aliaddo-codes.ts
```

- Útil si los códigos quedaron como `null` o `undefined`

### `fetch-aliaddo-data.ts`
Consulta ítems y taxes existentes en Aliaddo (para diagnóstico).

```bash
npx tsx scripts/fetch-aliaddo-data.ts
```

### `test-aliaddo.ts`
Crea una factura de prueba con datos mínimos para validar la conexión.

```bash
npx tsx scripts/test-aliaddo.ts
```

---

## Pendientes con el Contador

Los siguientes puntos deben resolverse en reunión con el contador antes de la apertura oficial:

| # | Tarea | Impacto |
|---|---|---|
| 1 | Cambiar ciudad de Bogotá a **Popayán (Cauca)** en la sucursal de Aliaddo | Aparece en la factura |
| 2 | Definir si aplica **IVA, INC u otro impuesto** a los servicios | Obligatorio para cumplimiento |
| 3 | Configurar **"Consumidor Final"** en Aliaddo para clientes sin cédula | Requerido para clientes anónimos |
| 4 | Definir cómo vincular el `personId` del cliente real en cada factura | La factura quede a nombre del cliente |
| 5 | Configurar los **productos del inventario** como ítems en Aliaddo | Actualmente usan el código `AGUA` como fallback |
| 6 | Validar la **resolución de facturación** con la DIAN para producción | La actual es de habilitación |

---

## Errores Comunes y Soluciones

### Error 409: "No existe un producto con este(os) código(s)"

**Causa**: El `itemCode` enviado no existe en el catálogo de Aliaddo.

**Solución**:
```bash
npx tsx scripts/sync-services-to-aliaddo.ts
npx tsx scripts/fix-aliaddo-codes.ts
```

---

### Error 401: Unauthorized

**Causa**: El token JWT de Aliaddo expiró.

**Solución**: Renovar el token en Aliaddo → Mis datos y actualizar `ALIADDO_API_KEY` en `.env`.

---

### Error FAD09e DIAN: "Valida que fecha de generación sea igual a la fecha de firma"

**Causa**: La fecha enviada no coincide con la zona horaria de Colombia.

**Estado**: ✅ Ya corregido en el código usando `getTimezoneOffset()`.

---

### PDF da error 404 en Aliaddo

**Causa**: La API v1 de Aliaddo **no tiene endpoint de PDF**. El PDF se accede exclusivamente desde el catálogo de la DIAN usando el CUFE.

**Solución**: Usar siempre el botón "Ver en Catálogo DIAN" del modal, que construye la URL con el CUFE correcto.

---

### La factura aparece como "Inválida" en la DIAN

**Causa**: La cuenta de Aliaddo está en modo de Habilitación (pruebas) y la DIAN puede rechazar algunas facturas por validaciones de configuración.

**Solución**: El contador debe activar el modo producción y obtener la resolución final de la DIAN.

---

*Última actualización: Agosto 2026*
*Desarrollado por: Antigravity AI + Sebastian*
