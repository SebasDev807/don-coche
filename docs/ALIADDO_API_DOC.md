# Documentación y Flujo de la API de Aliaddo

Este documento describe el funcionamiento básico y el flujo de integración con la API de Aliaddo para la emisión de facturación electrónica (POS/Ventas), gestión de clientes y productos.

## 1. Autenticación y Credenciales

La API de Aliaddo utiliza el estándar **OAuth2** para la autenticación. Todas las peticiones HTTP que se realicen a la API deben incluir el token de acceso en los headers.

### Obtención del Token (API Key)
Para empezar a interactuar con la API, necesitas un Token de Acceso que se genera desde la plataforma de Aliaddo:

1. Inicia sesión en tu cuenta de Aliaddo.
2. Haz clic en tu nombre de usuario ubicado en la esquina superior derecha.
3. Selecciona la opción **"Mis datos"**.
4. En esta sección podrás generar y gestionar tus credenciales de API.

### Uso del Token en Peticiones
Una vez obtenido el token, debes incluirlo en el header `Authorization` de todas tus peticiones:

```http
Authorization: Bearer TU_TOKEN_DE_ACCESO
```

---

## 2. Flujo Principal de Operación (Facturación POS / Ventas)

Para emitir una factura POS electrónica ante la DIAN usando Aliaddo, generalmente se sigue un flujo estructurado de datos. Aunque los endpoints específicos se detallan en su documentación técnica, el ciclo de vida estándar es el siguiente:

### A. Preparación de Datos (Requisitos Previos)
Antes de crear una factura, debes asegurarte de que los datos relacionados existan en Aliaddo:

1. **Gestión de Clientes (`/clientes`)**: 
   - Debes consultar si el cliente existe. Si no existe (por ejemplo, un cliente nuevo en tu POS), debes usar el endpoint de creación de clientes enviando sus datos básicos (Tipo de documento, Número, Nombre/Razón Social, Correo, etc.).
2. **Gestión de Productos/Servicios (`/productos`)**: 
   - Los ítems a facturar deben estar creados en el catálogo de Aliaddo con sus respectivos códigos, precios e impuestos (IVA, etc.).
3. **Sucursales y Cajas**: 
   - Identificar el ID de la sucursal y configuración desde la cual se está emitiendo la factura.

### B. Creación de la Factura de Venta
Una vez tienes el ID del cliente y los IDs de los productos, procedes a crear la factura.

- **Endpoint**: `POST /facturas-venta` (basado en la estructura de rutas de Aliaddo)
- **Cuerpo de la Petición (Payload)**:
  - `cliente_id`: Identificador del cliente.
  - `detalles`: Array con los productos/servicios vendidos (cantidades, precios, descuentos).
  - `metodos_pago`: Cómo pagó el cliente (Efectivo, Tarjeta, Transferencia).
  - `impuestos`: Información de impuestos aplicados (si aplica).

### C. Emisión a la DIAN (Facturación Electrónica)
Dependiendo de la configuración de Aliaddo:
- La creación de la factura puede **disparar automáticamente** el envío y validación ante la DIAN.
- El sistema de Aliaddo firma el XML, lo envía a la DIAN, y genera el CUFE (Código Único de Facturación Electrónica) y el código QR.

### D. Respuesta y Manejo de Errores
Al enviar la petición, Aliaddo responderá con un código HTTP:
- **200 / 201 (OK / Created)**: La factura fue creada exitosamente. La respuesta incluirá el ID de la factura, el link del PDF generado y los datos de validación de la DIAN.
- **400 (Bad Request)**: Hay errores de validación (ej. faltan datos del cliente o el producto no existe).
- **401 (Unauthorized)**: El token de acceso es inválido o expiró.
- **500 (Internal Server Error)**: Problemas en los servidores de Aliaddo o la DIAN.

---

## 3. Integración recomendada en Next.js (Backend)

Dado que usarás Next.js, la comunicación con Aliaddo debe realizarse **siempre desde el backend (Route Handlers o Server Actions)** para proteger tu Token de Acceso y no exponerlo en el frontend (navegador del usuario).

### Flujo en Next.js:
1. El usuario en el frontend (Don Coche App) presiona "Pagar y Facturar".
2. El frontend envía la data de la cita/venta al backend de Next.js (`/api/facturar`).
3. El backend de Next.js toma esos datos y construye el JSON requerido por Aliaddo.
4. Next.js hace un `fetch` a la API de Aliaddo incluyendo el header `Authorization`.
5. Aliaddo procesa, envía a la DIAN, y retorna el PDF/Confirmación.
6. Next.js recibe la confirmación, actualiza la base de datos local de Don Coche (marca la cita como pagada) y le devuelve el PDF al frontend para que el usuario lo descargue o imprima en la tiquetera POS.

---

## 4. Siguientes Pasos
Una vez que proporciones los links exactos de los endpoints (Base URL y payload de creación de factura), se podrá:
1. Configurar las variables de entorno (`ALIADDO_API_KEY`, `ALIADDO_API_URL`).
2. Crear un servicio en TypeScript (`src/services/aliaddo.ts`) para manejar las peticiones HTTP (crear cliente, consultar producto, crear factura).
3. Integrar este servicio en el flujo de pago actual de la aplicación.
