# Paleta de colores (usar exactamente estos valores y variables)

* `--bg-primary`: `#F8F9FA` (Gris Extra Claro - Fondo principal de toda la app para un modo light limpio y sin fatiga visual).
* `--bg-surface`: `#FFFFFF` (Blanco Puro - Fondo para tarjetas, tablas, modales y contenedores destacados).
* `--text-primary`: `#000000` (Negro - Títulos, textos principales y datos clave de alto contraste).
* `--text-secondary`: `#4B5563` (Gris Pizarra - Subtítulos, placeholders, textos secundarios y cabeceras de tablas).
* `--accent-primary`: `#FFEC00` (Amarillo Don Coche - Botones primarios, CTAs, pestañas activas y notificaciones).
* `--accent-secondary`: `#FFF9B2` (Amarillo Suave - Detalles secundarios, fondos sutiles para estados hover o filas seleccionadas).

# Reglas de Aplicación Visual

* **Fondo principal:** Usar `--bg-primary` en todas las vistas (dashboard, inventario, caja) para dar un respiro visual y separar los contenedores.
* **Botones primarios (CTAs):** Todo elemento de acción vital (Guardar y Enviar a Caja, Ejecutar Cierre, Agregar Stock) debe usar `--accent-primary` con texto en `--text-primary` (`#000000`).
* **Navegación / Layout:** Usar `--bg-surface` (`#FFFFFF`) para el Navbar y el Sidebar corporativo, manteniendo los textos oscuros y marcando la ruta activa con un bloque en `--accent-primary`.
* **Tarjetas y Contenedores:** Usar `--bg-surface` con sombras muy sutiles (soft drop shadows). **Regla estricta: CERO bordes negros sólidos.** La separación visual se logra con espacios en blanco (whitespace) y las sombras.
* **Usabilidad Operativa:** La interfaz debe ser "fat-finger friendly" (botones grandes, espaciado generoso). Para garantizar la agilidad del técnico en la pista, el diseño debe priorizar la selección rápida de servicios y opciones mediante interfaces basadas en botones (toggles/selectores), eliminando por completo la necesidad de escribir texto manualmente.

# Tipografía

* **Títulos y encabezados (H1, H2, H3, KPIs):** Uso obligatorio de una fuente Sans-Serif geométrica y moderna (ej. *Poppins* o *Montserrat*) para dar un aspecto corporativo, limpio y de fácil lectura en los paneles gerenciales.
* **Cuerpo de texto, inputs, tablas y botones:** Uso obligatorio de una fuente Sans-Serif neutra y altamente legible (ej. *Inter* o *Roboto*) optimizada para interfaces digitales y lectura rápida en pantallas de tablets.

# Prioridades y Reglas de Arquitectura

* **Reutilización estricta:** Trabaja pensando en componentes modulares. Crea un componente `ServiceToggleBtn` (para selección ágil en pista), `KpiCard` (para el dashboard y cuadre de caja), `DataTable` estandarizada (sin bordes) y un `ActionModal` base con efecto de fondo borroso (backdrop blur).
* **Layouts Especializados:** El sistema requiere dos estructuras maestras: Un `AdminLayout` (Sidebar + Navbar) para los administradores y gerencia, y un `PistaLayout` (Header simplificado, vista apaisada) adaptado exclusivamente para el uso en tablets por parte de los técnicos.
* **Estructura de carpetas:** Maneja el App Router dividiendo por dominios operativos del negocio. Ej. `/pista` (operación táctil), `/recepcion` (cobro y órdenes en vivo), `/admin/inventario` (gestión de stock y rentabilidad), y `/components` para la UI base.
* **Stack Tecnológico Exclusivo:** El desarrollo se construirá utilizando únicamente Next.js. El enfoque está en aprovechar todo el potencial del framework (Server Components, Server Actions) para mantener el código cohesivo, tomando el tiempo que sea necesario para estructurar una base inquebrantable.
* **Control de dependencias:** No instales UI kits complejos, pesados o fuertemente pre-estilizados. Mantén la configuración minimalista y enfocada en construir un Producto Mínimo Viable (MVP) que sea excepcionalmente fácil e intuitivo de usar.
* **Tono:** La interfaz y la comunicación del sistema deben ser directas, operativas y eficientes, sin elementos visuales superfluos que distraigan del flujo de trabajo de la serviteca.