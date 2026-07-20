# 🚀 Plan de Entrega — 21 de Julio 2026

> **Objetivo:** Entregar un avance funcional significativo que demuestre el flujo operativo completo del negocio (Técnico → Orden → Caja) y los módulos de soporte necesarios.

> **Alcance:** Se priorizan los bloques que generan valor operativo inmediato. Se excluyen integraciones con APIs externas (WhatsApp, email) y el agendamiento web que requieren más tiempo.

---

## Resumen de Bloques (Orden de Ejecución)

| # | Bloque | Impacto | Estimación |
|---|--------|---------|------------|
| 1 | CRUD Catálogo de Servicios | Alto — prerequisito para el flujo de órdenes | ~1.5h |
| 2 | Módulo de Clientes y Vehículos | Alto — prerequisito para registrar órdenes | ~1.5h |
| 3 | Flujo Técnico → Orden (Fase 1) | Crítico — el técnico crea órdenes reales | ~2h |
| 4 | Panel Caja / Recepción (Fase 2) | Crítico — el admin factura y cobra | ~2h |
| 5 | KPIs del Dashboard con datos reales | Alto — reemplazar mocks por queries reales | ~1h |
| 6 | Restricciones de rol + Descuento automático de stock | Alto — seguridad y lógica de negocio | ~1h |

---

## Bloque 1: CRUD Catálogo de Servicios

> **Justificación:** El modelo `ServiceCatalog` ya existe en Prisma pero no tiene UI ni actions. El técnico necesita seleccionar servicios reales (no mocks) al crear una orden. Sin esto, el flujo de órdenes no funciona.

### [NEW] `validation/service/index.ts`
- Schema Zod para crear/editar servicios: `name`, `categoryId`, `basePrice`, `description` (opcional)

---

### [NEW] `actions/services/core.actions.ts`
- `getServices(query?, categoryId?)` — Listar servicios activos con filtros
- `createService(formData)` — Crear nuevo servicio con validación Zod

### [NEW] `actions/services/updateService.actions.ts`
- `updateService(id, formData)` — Editar servicio existente

### [NEW] `actions/services/deleteService.actions.ts`
- `deleteService(id)` — Soft delete (`isActive = false`)

### [NEW] `actions/services/index.ts`
- Barrel export

---

### [NEW] `app/(dashboard)/servicios/page.tsx`
- Server Component: query de servicios activos desde la DB, KPIs básicos (total servicios, categoría líder), renderiza tabla + toolbar
- Patrón idéntico a `app/(dashboard)/inventario/page.tsx`

### [NEW] `app/(dashboard)/servicios/nuevo/page.tsx`
- Formulario para crear servicio

### [NEW] `app/(dashboard)/servicios/editar/[id]/page.tsx`
- Formulario para editar servicio

---

### [NEW] `components/dashboard/servicios/ServiceTable.tsx`
- Tabla paginada con columnas: Nombre, Categoría, Precio Base, Estado
- Acciones: Editar, Eliminar
- Mismo patrón que `InventoryTable.tsx`

### [NEW] `components/dashboard/servicios/ServiceToolbar.tsx`
- Buscador + filtro por categoría + botón "Nuevo Servicio"
- Mismo patrón que `InventoryToolbar.tsx`

### [NEW] `components/dashboard/servicios/CreateServiceForm.tsx`
- Formulario: nombre, categoría (select dinámico), precio base, descripción
- Mismo patrón que `CreateProductForm.tsx`

### [NEW] `components/dashboard/servicios/EditServiceForm.tsx`
- Formulario de edición pre-poblado
- Mismo patrón que `EditProductForm.tsx`

---

## Bloque 2: Módulo de Clientes y Vehículos

> **Justificación:** Para crear una orden, necesitamos asociar un vehículo (placa). Los modelos `Customer` y `Vehicle` ya existen pero no tienen frontend. El técnico registra placa + datos del propietario al crear la orden.

### [NEW] `actions/vehicles/core.actions.ts`
- `findOrCreateVehicle(plate, customerData?)` — Busca por placa; si no existe, crea el vehículo y opcionalmente el customer asociado
- `getVehicleByPlate(plate)` — Búsqueda rápida para autocompletado en la pantalla del técnico

### [NEW] `actions/vehicles/index.ts`
- Barrel export

---

### [NEW] `app/(dashboard)/vehiculos/page.tsx`
- Listado de vehículos con datos del cliente asociado
- Búsqueda por placa

### [NEW] `components/dashboard/vehiculos/VehicleTable.tsx`
- Tabla con columnas: Placa, Propietario, Celular, Email, Fecha Registro

### [NEW] `components/dashboard/vehiculos/VehicleToolbar.tsx`
- Buscador por placa

---

## Bloque 3: Flujo Técnico → Orden (Completar Fase 1)

> **Justificación:** Este es el corazón del sistema. Actualmente la pantalla del técnico tiene UI estática (no conectada a la DB). Necesitamos que el técnico pueda: registrar un vehículo, seleccionar servicios y productos reales, y enviar la orden a caja.

### [NEW] `actions/orders/core.actions.ts`
- `createOrder({ technicianId, vehicleId, services[], products[] })` — Crea la orden con estado `EN_PISTA`, asocia servicios y productos seleccionados, calcula totales
- `getServicesForTecnico()` — Lista servicios activos para la pantalla del técnico
- `getProductsForTecnico()` — Lista productos activos (sin mostrar valor total del inventario, cumpliendo RN-004)
- `searchByPlate(plate)` — Buscar vehículo existente para autocompletar datos del cliente

### [NEW] `actions/orders/index.ts`
- Barrel export

### [NEW] `validation/order/index.ts`
- Schema Zod para la creación de orden: `plate` (requerida), `customerName`, `customerPhone`, `customerEmail`, `services[]` (al menos 1), `products[]` (opcional con cantidad)

---

### [MODIFY] `components/tecnico/RegistrationForm.tsx`
- **Convertir a Client Component** con `'use client'`
- Agregar `useState` para placa, propietario, celular, correo
- Implementar búsqueda en tiempo real por placa (debounce): si existe, autocompletar datos del cliente
- Levantar el estado hacia el componente padre para compartir con ServicesPanel
- Comunicar datos del vehículo/cliente al flujo de creación de orden

### [MODIFY] `components/tecnico/ServicesPanel.tsx`
- **Convertir a Client Component** con `'use client'`
- Reemplazar datos mock `FREQUENT_SERVICES` por servicios reales desde la DB (pasados como props desde el Server Component padre)
- Implementar selección múltiple de servicios y productos con cantidad
- Mantener el resumen de orden con cálculo de total en tiempo real
- El botón "Finalizar y Enviar a Caja" ejecutará el `createOrder` server action

### [MODIFY] `components/tecnico/ServiceCard.tsx`
- Agregar prop `price` para mostrar el precio al lado del nombre
- Agregar estado de selección visual (toggle activo/inactivo con animación)
- Callback `onToggle(serviceId)` para comunicar selección al padre

### [MODIFY] `app/tecnico/page.tsx`
- Pasar servicios y productos reales como props al refactorizar
- Cargar datos del catálogo desde la DB en el Server Component
- Crear un componente wrapper Client Component que maneje el estado compartido entre `RegistrationForm` y `ServicesPanel`

### [NEW] `components/tecnico/TecnicoOrderFlow.tsx`
- **Client Component** wrapper que mantiene el estado global de la orden del técnico
- Estado: `{ vehicle, customer, selectedServices[], selectedProducts[], isSubmitting }`
- Renderiza `RegistrationForm` y `ServicesPanel` como hijos pasándoles estado + callbacks
- Maneja el submit final llamando al server action `createOrder`

### [NEW] `components/tecnico/ProductSelector.tsx`
- Lista de productos disponibles con buscador
- Selección con cantidad ajustable (+/-)
- Muestra stock disponible (sin valor total económico — RN-004)

---

## Bloque 4: Panel de Caja / Recepción (Fase 2)

> **Justificación:** Una vez que el técnico crea la orden (`EN_PISTA`), el Administrador debe verla en su panel, revisarla, y facturarla. Sin esto, el ciclo operativo no se cierra.

### [NEW] `actions/orders/admin.actions.ts`
- `getPendingOrders()` — Órdenes con estado `EN_PISTA`, ordenadas por creación (más recientes primero)
- `getOrderDetail(orderId)` — Detalle completo: vehículo, técnico, servicios, productos, totales
- `billOrder(orderId, paymentMethod)` — Cambia estado a `FACTURADA`, asigna `adminId`, registra `billedAt`, método de pago, y **descuenta stock** de productos
- `cancelOrder(orderId)` — Cambia estado a `CANCELADA` (no descuenta stock)
- `getTodayBilledOrders()` — Órdenes facturadas del día para el cuadre de caja
- `getDailyCashSummary()` — Resumen del cuadre diario: total servicios, total productos, gran total, desglose por método de pago

---

### [NEW] `app/(dashboard)/caja/page.tsx`
- Server Component principal del panel de caja
- Muestra dos secciones:
  1. **Órdenes Pendientes** (`EN_PISTA`) — cards con info resumida
  2. **Cuadre del Día** — tabla de órdenes facturadas con totales

### [NEW] `app/(dashboard)/caja/[id]/page.tsx`
- Detalle de una orden específica
- Muestra: datos del vehículo/cliente, técnico que la registró, lista de servicios con precios, lista de productos con cantidades y precios
- Botones: "Facturar" (con selector de método de pago) y "Cancelar Orden"

---

### [NEW] `components/dashboard/caja/PendingOrderCard.tsx`
- Card resumida de una orden pendiente: #orden, placa, técnico, total estimado, hora de creación
- Click lleva al detalle `caja/[id]`
- Indicador visual de tiempo transcurrido

### [NEW] `components/dashboard/caja/OrderDetail.tsx`
- Client Component con el detalle expandido de la orden
- Tabla de servicios + tabla de productos
- Selector de método de pago (EFECTIVO | TARJETA | TRANSFERENCIA)
- Botón "Facturar y Cobrar" + "Cancelar Orden"

### [NEW] `components/dashboard/caja/DailyCashSummary.tsx`
- Tabla de órdenes facturadas hoy
- Footer con totales por método de pago y gran total del día

---

### [MODIFY] `components/dashboard/Sidebar.tsx`
- Agregar entrada de navegación para `/caja` con icono `point_of_sale`
- Actualizar `NAV_ITEMS` con: `{ icon: 'point_of_sale', label: 'Caja', href: '/caja' }`

### [MODIFY] `components/dashboard/MobileBottomNav.tsx`
- Agregar entrada de navegación para `/caja` en la barra inferior móvil

---

## Bloque 5: KPIs del Dashboard con Datos Reales

> **Justificación:** Actualmente el dashboard usa datos mock de `data/mocks.ts`. Necesitamos que muestre información real del día para que el Gerente/Admin pueda tomar decisiones.

### [NEW] `actions/dashboard/kpis.actions.ts`
- `getDashboardKPIs()` — Calcula:
  - **Ventas Totales del Día:** `SUM(grandTotal)` de órdenes `FACTURADA` de hoy
  - **Rentabilidad Promedio:** Cálculo basado en `(salePrice - unitCost) / salePrice` de los productos vendidos hoy
  - **Valor Inventario Global:** `SUM(unitCost * stock)` de todos los productos activos (solo visible para GERENTE)
- `getWeeklyChartData()` — Datos de gráfica: ingresos agrupados por día de la semana actual, separados por categoría Lavadero vs Serviteca
- `getRecentMovements()` — Últimas 10 órdenes (reemplaza `DASHBOARD_MOVEMENTS` mock)

### [MODIFY] `app/(dashboard)/page.tsx`
- Reemplazar imports de `data/mocks` por llamadas a los actions reales
- Pasar datos del rol del usuario para condicionar la visibilidad del KPI de inventario global
- Mantener la misma estructura visual, solo cambiar la fuente de datos

---

## Bloque 6: Restricciones de Rol + Descuento Automático de Stock

> **Justificación:** Reglas de negocio RN-003 y RN-004 requieren que ciertos datos y acciones estén restringidos por rol. El descuento automático de stock es parte fundamental de RF-005.

### [MODIFY] `actions/orders/admin.actions.ts` (en `billOrder`)
- Al facturar: por cada `OrderProduct`, crear un `InventoryMovement` de tipo `VENTA` y decrementar el `stock` del producto
- Usar transacción Prisma (`$transaction`) para garantizar atomicidad

### [MODIFY] `app/(dashboard)/page.tsx`
- Condicionar el KPI "Valor Inventario Global" a que `user.role === 'GERENTE'` o `'SUPERUSUARIO'`

### [MODIFY] `app/(dashboard)/inventario/page.tsx`
- Ocultar columna `unitCost` y el KPI de "Valor Total" para roles que no sean GERENTE/SUPERUSUARIO
- Pasar el rol del usuario como prop a los componentes de inventario

### [MODIFY] `components/dashboard/inventario/InventoryTable.tsx`
- Aceptar prop `userRole` para condicionar visibilidad de columna de costo
- Ocultar precio de costo para ADMINISTRADOR y TECNICO

### [MODIFY] `components/dashboard/inventario/InventoryKpiCards.tsx`
- Aceptar prop `userRole` para condicionar visibilidad del KPI de valor total

---

## Archivos de Navegación a Actualizar

> Estos archivos necesitan actualizarse para incluir las nuevas rutas de Servicios, Caja y Vehículos.

### [MODIFY] `components/dashboard/Sidebar.tsx`
- Actualizar `NAV_ITEMS` para incluir las rutas reales `/servicios`, `/caja` y `/vehiculos` (actualmente `/servicios` y `/cierres` apuntan a rutas que no existen)

### [MODIFY] `components/dashboard/MobileBottomNav.tsx`
- Actualizar `BOTTOM_NAV_ITEMS` para incluir las rutas prioritarias en mobile

---

## Open Questions

> [!IMPORTANT]
> **¿Cuadre de caja como módulo separado?** Actualmente el sidebar tiene un link a `/cierres` (Cierres de Caja). ¿Prefieres que el cuadre del día sea parte de la página `/caja` o que sea un módulo separado en `/cierres` con historial de cierres?

> [!IMPORTANT]
> **Pantalla del técnico — ¿productos también?** En el ERS (RF-002) el técnico registra "servicios ejecutados, repuestos instalados y datos del vehículo". ¿Quieres que el técnico también pueda agregar productos/repuestos a la orden, o solo servicios?

> [!IMPORTANT]
> **¿Prioridad estricta de bloques?** Si el tiempo se acorta mañana, ¿prefieres que me concentre SOLO en los bloques 1-4 (flujo operativo completo) y deje los bloques 5-6 (KPIs reales + restricciones de rol) para después?

---

## Verification Plan

### Automated Tests
- `npx prisma db push` para verificar que no hay errores en el schema
- `npm run build` para verificar compilación sin errores de TypeScript
- Verificación manual del flujo completo: Login Técnico → Crear Orden → Login Admin → Ver Orden → Facturar → Verificar descuento de stock

### Manual Verification
1. Login como TECNICO → registrar vehículo → seleccionar servicios/productos → enviar a caja
2. Login como ADMINISTRADOR → ver orden pendiente → revisar detalle → facturar con método de pago
3. Verificar que el stock se decrementó correctamente
4. Login como GERENTE → verificar KPIs reales en dashboard → verificar visibilidad del valor del inventario
5. Login como TECNICO → verificar que NO ve el valor total del inventario
