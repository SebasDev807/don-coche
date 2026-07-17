---
name: Automotive Service System
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4a4731'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#7c785f'
  outline-variant: '#cdc7aa'
  surface-tint: '#686000'
  primary: '#686000'
  on-primary: '#ffffff'
  primary-container: '#ffec00'
  on-primary-container: '#736a00'
  inverse-primary: '#d9c900'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e2'
  on-secondary-container: '#646464'
  tertiary: '#5f5e5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#ebe8e7'
  on-tertiary-container: '#696868'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f8e600'
  primary-fixed-dim: '#d9c900'
  on-primary-fixed: '#1f1c00'
  on-primary-fixed-variant: '#4e4800'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Sora
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  cta:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '700'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  touch-target-min: 56px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The brand personality is high-octane, precise, and professional. Designed for an automotive service environment, the UI prioritizes immediate legibility and functional speed. The style is **Modern High-Contrast**, utilizing a "Racing" aesthetic—sharp blacks, electric yellows, and clean whites—to evoke a sense of movement and efficiency.

The target audience includes both vehicle owners seeking a premium car wash experience and service technicians managing workflows in fast-paced garage environments. The emotional response should be one of reliability and technological edge, ensuring users feel their vehicle is in expert hands.

## Colors
This design system employs a high-contrast palette to ensure visibility in varied lighting conditions, such as bright outdoor wash bays or dimly lit service areas.

- **Primary (Yellow):** Used exclusively for high-priority Call to Actions (CTAs), progress indicators, and active states. It represents energy and caution/attention.
- **Secondary (Black):** Used for headers, navigation bars, and primary text to provide a grounded, professional foundation.
- **Surface (White/Light Grey):** Used for the main content area and cards to maintain a "clean" feel, mirroring the result of a car wash.
- **Functional Greys:** Used for secondary information and borders to prevent visual clutter while maintaining structure.

## Typography
The typography is built for impact and utility. **Sora** provides a geometric, mechanical feel for headings and labels, while **Public Sans** ensures maximum readability for body text and service descriptions.

Key rules:
- **Spanish Language Optimization:** Line heights are slightly increased to accommodate the longer average word length and character descenders in Spanish.
- **Information Hierarchy:** Use `label-bold` for technical specs (e.g., "MATRÍCULA", "TIPO DE LAVADO").
- **Boldness:** Headings should almost always be Semibold or Bold to maintain the "Automotive" presence.

## Layout & Spacing
The layout follows a **Fluid Grid** system designed for high-dexterity use ("fat-finger friendly"). This is critical for users who may be using the app on a tablet mounted in a garage or a phone while waiting in their car.

- **Grid:** 12-column layout for desktop, 4-column for mobile.
- **Touch Targets:** All interactive elements (buttons, toggles, inputs) must have a minimum height of `56px`.
- **Rhythm:** An 8px linear scale is used. Generous vertical spacing (`stack-lg`) is encouraged between major sections to prevent accidental taps and reduce cognitive load.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and sharp contrast rather than traditional heavy shadows.

- **Level 0 (Background):** Solid white or very light grey (`#F5F5F5`).
- **Level 1 (Cards):** Pure white with a subtle `1px` border in `#E0E0E0` or a very soft, diffused ambient shadow to separate it from the background.
- **Level 2 (Modals/Overlays):** Solid black backgrounds with white or yellow text for maximum focus.
- **Interactive Depth:** When a button is pressed, it should "sink" (remove shadow or shift color slightly darker) to provide tactile feedback.

## Shapes
The shape language is **Rounded**, using an 8px (`0.5rem`) radius as the standard. This strikes a balance between the precision of engineering and the approachability of a service-oriented business.

- **Primary Buttons:** Use the standard `rounded-md` (8px).
- **Service Tags/Chips:** Use `rounded-xl` for a more pill-like shape to distinguish them from actionable buttons.
- **Input Fields:** Maintain the 8px radius to keep a consistent visual container.

## Components
Consistent component behavior ensures the app feels professional and rugged.

- **Buttons:**
    - **Primary:** Background `#FFEC00`, Text `#000000`, 56px height. Bold `cta` type.
    - **Secondary:** Background `#000000`, Text `#FFFFFF`.
- **Input Fields:** Large text entry areas with a floating label pattern. The border turns Primary Yellow on focus.
- **Status Chips:** Use high-saturation background colors for "En Proceso" (Blue), "Completado" (Success Green), and "Pendiente" (Grey).
- **Service Cards:** Use a heavy black header or a primary yellow top-accent bar to categorize different car wash tiers (e.g., "Básico", "Premium", "Platino").
- **Vehicle Selection:** Large, card-based selection patterns with clear iconography or photos of vehicle types (Sedán, SUV, Camioneta).