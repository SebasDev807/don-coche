# Requerimientos de la Versión 2 (v2.0.0)

Este documento detalla las características y requerimientos solicitados para la versión 2 del sistema, organizados lógicamente en fases de desarrollo con el seguimiento de estado de cada uno.

## 🚀 Fase 1: Base de Datos y Lógica de Precios
En esta fase nos enfocamos en los cambios a nivel de estructura de datos y el cálculo automatizado de precios.

*   [x] **Agregar campo de Porcentaje de ganancia en servicios/productos:** Se modificó el modelo en Prisma para incluir el margen de ganancia.
*   [x] **Calcular precio al público en base al porcentaje de ganancia:** El precio final de venta al público (PVP) es un campo calculado automáticamente (`Costo + (Costo * Porcentaje / 100)`).
*   [x] **Deshabilitar edición manual de precios:** El precio al público se calcula automáticamente a partir del costo y el porcentaje de ganancia.

## 📦 Fase 2: Gestión de Inventario y Códigos de Barras
Esta fase mejoró la experiencia de registro y actualización del stock.

*   [x] **Registro de producto manual y por código de barras:** Permite ingresar los datos manualmente o escanear un código de barras con pistola láser.
*   [x] **Aumentar stock en base a código de barras:** Vista/modal express para escanear el código de barras y sumar unidades al inventario.

## 🛡️ Fase 3: Roles, Permisos y Seguridad
Esta fase asegura la integridad de los datos y restringe acciones críticas según la jerarquía de roles.

*   [x] **Restricción de eliminación de productos:** Se removió el permiso de eliminación directa de productos para usuarios Administradores.
*   [x] **Protección de rol Gerente:** Validación en la gestión de personal para impedir que el rol de "Gerente" sea modificado o degradado.

## 📱 Fase 4: Notificaciones, Fidelización y Verificación
Esta fase mejorará la comunicación automatizada con los clientes y la gestión multimedia.

*   [ ] **Fidelización automática por WhatsApp:** Sistema automatizado de recordatorios para mantenimiento preventivo y seguimiento de servicios del vehículo a través de WhatsApp.
*   [ ] **Validación de correo electrónico:** Verificación de cuentas de usuario y confirmaciones por email mediante tokens de verificación.
*   [ ] **Gestión de imágenes en la nube (Cloudinary):** Integración con Cloudinary para la carga y optimización de imágenes de perfil, vehículos e inventario.

## 🧾 Fase 5: Facturación Electrónica POS (DIAN)
Integración del sistema de ventas con las normativas fiscales colombianas.

*   [ ] **Facturación Electrónica POS DIAN:** Integración mediante API de Proveedor Tecnológico (ej. Alegra / Siigo) para la emisión de facturas electrónicas, generación de CUFE, código QR y transmisión a la DIAN.

## 🚀 Fase 6: Despliegue en Producción
Puesta en marcha del sistema en infraestructura de nube accesible al público.

*   [ ] **Configuración de Infraestructura:** Base de datos PostgreSQL en la nube, despliegue de Next.js (Vercel/VPS), variables de entorno, dominio personalizado y certificados SSL.

---
*Nota: Este documento sirve como guía principal para la rama `v-2.0.0`.*
