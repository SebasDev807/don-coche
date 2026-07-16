# 🚗 Don Coche App

**Don Coche App** es un sistema integral de gestión y facturación diseñado para automatizar y agilizar las operaciones de un centro de servicios automotrices. El sistema maneja múltiples áreas del negocio incluyendo: **Lavadero, Serviteca, Lubricantes y Accesorios**.

## 🚀 Tecnologías Principales

Este proyecto está construido utilizando las últimas tecnologías del ecosistema moderno de desarrollo web:

- **Framework Core**: [Next.js 16](https://nextjs.org/) (App Router) y [React 19](https://react.dev/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Base de Datos & ORM**: PostgreSQL (alojado en [Neon](https://neon.tech/)) + [Prisma ORM v7](https://www.prisma.io/) (utilizando `@prisma/adapter-pg`)
- **Manejo de Estado**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Formularios**: [React Hook Form](https://react-hook-form.com/)
- **Lenguaje**: TypeScript

## 🌟 Características Clave

1. **Gestión de Roles y Accesos (RBAC):**
   - **Técnico:** Encargado de registrar servicios y productos en la pista.
   - **Administrador:** Encargado de la facturación, caja, creación de clientes y cuadres.
   - **Gerente:** Acceso total, visualización de márgenes de ganancia e inventarios.

2. **Gestión Operativa (Órdenes):**
   - Seguimiento del estado del vehículo desde que entra a la pista (`EN_PISTA`) hasta que finaliza (`FACTURADA`).
   - Asignación de servicios y venta de productos.

3. **Control de Inventario y Catálogos:**
   - Auditoría de movimientos de stock (ingresos, ventas, ajustes).
   - Catálogo de servicios centralizado con precios base.

4. **Registro de Clientes y Vehículos:**
   - Vinculación de vehículos a dueños específicos para seguimiento histórico e identificación rápida en pista mediante la placa.

## ⚙️ Configuración y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/SebasDev807/don-coche.git
cd don-coche
```

### 2. Instalar dependencias
El proyecto utiliza `pnpm` como gestor de paquetes.
```bash
pnpm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto. Este archivo debe contener la cadena de conexión a tu base de datos:
```env
DATABASE_URL="postgresql://usuario:password@host:port/dbname?sslmode=require"
```

### 4. Inicializar la base de datos
Para aplicar el esquema a la base de datos y generar el cliente de Prisma:
```bash
# Empujar las tablas a la base de datos de desarrollo
npx prisma migrate dev --name init

# Generar el cliente de Prisma (si no se generó automáticamente)
npx prisma generate
```

### 5. Poblar la base de datos (Seed)
Para insertar los usuarios iniciales (Gerente, Administrador, Técnico) con fines de prueba:
```bash
npx prisma db seed
```

### 6. Ejecutar el servidor de desarrollo
```bash
pnpm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación corriendo.

## 🗄️ Esquema de la Base de Datos

El diseño de la base de datos está pensado para escalabilidad y precisión financiera:
- **Órdenes**: Mantienen un historial inmutable de los precios cobrados (precios de venta y costos de unidad) en el momento de la facturación para calcular ganancias reales.
- **Inventario**: Utiliza una tabla de auditoría `InventoryMovement` para rastrear cada adición o sustracción de inventario.
- **Identificadores**: Se utilizan UUIDs nativos de PostgreSQL para mayor seguridad en la integración de registros.
