# Requerimientos de la Versión 2 (v2.0.0)

Este documento detalla las características y requerimientos solicitados para la versión 2 del sistema, organizados lógicamente en fases de desarrollo para facilitar su implementación.

## 🚀 Fase 1: Base de Datos y Lógica de Precios
En esta fase nos enfocaremos en los cambios a nivel de estructura de datos y el cálculo automatizado de precios.

*   **Agregar campo de Porcentaje de ganancia en servicios:** Se modificará el modelo de servicios (o productos/servicios) en la base de datos (schema de Prisma) para incluir un campo dedicado al margen de ganancia.
*   **Calcular precio al público en base al porcentaje de ganancia:** El precio final de venta al público (PVP) pasará a ser un campo calculado automáticamente. La fórmula base será: `Costo + (Costo * Porcentaje de Ganancia / 100)`.
*   **No modificar precios:** Como el precio al público será un valor calculado a partir del costo y el porcentaje de ganancia, se deshabilitará la edición manual directa del precio de venta en las interfaces de usuario.

## 📦 Fase 2: Gestión de Inventario y Códigos de Barras
Esta fase mejorará la experiencia de registro y actualización del stock para hacerla más ágil.

*   **Registro de producto manual y por código de barras:** Al crear un nuevo producto, se permitirá ingresar los datos manualmente o escanear un código de barras utilizando una pistola láser para agilizar el proceso y vincular el código al producto.
*   **Aumentar stock en base a código de barras:** Se implementará una vista o modal donde el usuario pueda simplemente escanear el código de barras (con la pistola láser) de un producto existente y sumar unidades al inventario de forma rápida, sin tener que buscar el producto manualmente. 
    *   *Nota Técnica:* Las pistolas láser funcionan emulando un teclado que escribe los números rápidamente seguidos de un "Enter". La interfaz estará preparada para escuchar esta entrada veloz y ejecutar la acción automáticamente.

## 🛡️ Fase 3: Roles, Permisos y Seguridad
La última fase asegurará la integridad de los datos y restringirá acciones críticas según la jerarquía de roles.

*   **El Admin no puede borrar productos del inventario:** Se removerá el permiso de eliminación física (o lógica, según se defina) de productos para los usuarios con rol de Administrador. Solo podrán desactivarlos o marcarlos como inactivos, o bien la acción estará reservada solo para un rol superior (SuperAdmin) si existe.
*   **No poder cambiarle roles al gerente:** Se implementará una validación en la gestión de usuarios para proteger a los usuarios con el rol de "Gerente" (Manager), impidiendo que sus roles sean modificados, degradados o alterados por otros usuarios (incluso si son admins).

---
*Nota: Este documento sirve como guía principal para la rama `v-2.0.0`.*
