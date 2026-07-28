# Avance Funcional - Don Coche App

Este documento detalla todas las características, módulos y funcionalidades implementadas en la aplicación de gestión para el autolavado y serviteca **Don Coche**. Está diseñado para brindar un panorama completo del alcance del sistema, ideal para consultas de cotización o valoración del software.

## 1. Arquitectura y Tecnología Base
La aplicación está construida sobre un stack tecnológico moderno, robusto y escalable:
- **Frontend & Backend (Fullstack):** Next.js 14+ (App Router) con React.
- **Lenguaje:** TypeScript para mayor seguridad y robustez del código.
- **Estilos y Diseño:** Tailwind CSS, con un diseño moderno, responsivo (adaptable a móviles y tablets) y enfocado en la experiencia de usuario (UX/UI).
- **Base de Datos:** PostgreSQL.
- **ORM:** Prisma, garantizando integridad referencial y consultas optimizadas.
- **Seguridad:** Sistema de autenticación encriptado y control de acceso basado en roles (RBAC).

---

## 2. Gestión de Usuarios y Roles (Autenticación)
El sistema cuenta con niveles de acceso estrictos para asegurar la privacidad de la información financiera y operativa.
- **Técnico:** Acceso limitado a la vista de pista para ver los vehículos asignados y los servicios que deben realizar. Pueden registrar su asistencia (Entrada/Salida).
- **Administrador / Recepcionista:** Creación de clientes, vehículos y órdenes. Facturación básica en caja.
- **Gerente:** Acceso a reportes financieros, inventario avanzado, ajuste de precios y métricas del negocio.
- **Superusuario:** Control total del sistema.

---

## 3. Módulo de Personal y Asistencia (RRHH)
- **Control de Asistencia:** Sistema de "Reloj Control" donde los técnicos y empleados pueden registrar su hora de entrada (Clock-In) y salida (Clock-Out).
- **Reportes de Tiempo:** Los gerentes pueden ver resúmenes diarios, semanales o mensuales de las horas trabajadas por cada empleado.

---

## 4. Módulo de Inventario
Control estricto de mercancía y repuestos para evitar pérdidas.
- **Catálogo de Productos:** Registro detallado con nombre, código de barras, categoría (Lavadero, Serviteca, Lubricantes, Accesorios), costo unitario, precio de venta y margen de ganancia.
- **Soporte para Código de Barras:** Escaneo ágil para búsqueda rápida de productos.
- **Auditoría de Movimientos:** Historial inmutable de entradas, salidas y ajustes de inventario. Cada movimiento registra qué administrador lo hizo, la cantidad, el stock previo, el nuevo stock y el motivo.
- **Alertas de Stock:** Control visual del inventario disponible.

---

## 5. Módulo de Servicios
- **Catálogo de Servicios:** Gestión de los servicios ofrecidos (ej. Lavado Sencillo, Cambio de Aceite, Alineación) con precios base configurables y categorización.

---

## 6. Módulo de Clientes y Vehículos
- **Registro de Clientes:** Base de datos de clientes con nombre, teléfono (para recordatorios/WhatsApp) y correo.
- **Gestión de Vehículos:** Registro de vehículos vinculados a un cliente. Se indexa por **placa** para una búsqueda ultrarrápida cuando un auto entra a la pista. Se guarda marca, modelo y color.
- **Historial de Servicios:** Posibilidad de ver qué servicios se le han realizado a cada vehículo a lo largo del tiempo.

---

## 7. Módulo Operativo (Pista y Órdenes de Trabajo)
Es el corazón operativo de la aplicación.
- **Creación de Órdenes:** Cuando entra un auto, se crea una orden en estado `EN_PISTA`.
- **Asignación:** Se asigna un técnico responsable y el vehículo correspondiente.
- **Carga de Consumos:** Se agregan los servicios a realizar y los productos (repuestos, lubricantes) a utilizar en tiempo real.
- **Flujo de Trabajo:** Cambio de estados fluidos desde que el auto entra hasta que sale.

---

## 8. Módulo de Caja y Facturación
Control financiero preciso al momento de finalizar el servicio.
- **Facturación de Órdenes:** Las órdenes `EN_PISTA` pasan a `FACTURADA`.
- **Métodos de Pago:** Soporte para registrar si el pago fue en EFECTIVO, TARJETA o TRANSFERENCIA.
- **Inmutabilidad Financiera:** Al facturar, se congelan los costos y precios de venta de ese momento exacto, garantizando que el reporte de ganancias reales no se altere si los precios cambian a futuro.
- **Cuadre de Caja:** Cierres de caja y visualización de ingresos del día filtrables.

---

## 9. Dashboard y Métricas (Reportes)
- **Panel de Control:** Resumen ejecutivo en tiempo real para gerencia.
- **Métricas Clave:** Total de ingresos, número de órdenes, servicios más vendidos, rendimiento de los técnicos.
- **Sistema de Notificaciones:** Centro de notificaciones (campanita) en tiempo real para alertar sobre eventos importantes dentro del sistema.

---

## Conclusión del Alcance
El sistema "Don Coche" no es simplemente un punto de venta (POS), es un **ERP (Enterprise Resource Planning)** a medida, especializado para el sector automotriz. Cubre el ciclo de vida completo del negocio: desde que el empleado marca su entrada, el cliente llega, el vehículo entra a pista, se consumen recursos de inventario, hasta que se factura en caja y el gerente revisa la rentabilidad final.
