# Next.js Best Practices

This document outlines the recommended best practices for developing with Next.js (specifically using the App Router), covering component reusability, project structure, and SEO optimization. 

## 1. Project Organization & Component Reusability

Next.js App Router is unopinionated about where you store your project files, but it provides powerful routing conventions to help you scale your codebase efficiently.

### `app` Directory is Exclusively for Routing
The `app` directory should be used **strictly for defining routes** using `page.tsx`, `layout.tsx`, and `route.ts` files. 
- **No Colocation in `app`**: Do not place UI components, hooks, or utility functions inside the `app` directory.
- **Store project files outside of `app`**: Keep all application code in shared folders outside of the `app` directory (for example, inside a `src/` directory or root folders like `components/`, `lib/`, `hooks/`). This clearly separates routing logic from application logic.

### Component Organization
Rather than dumping everything into a massive global `components` folder:
- **Global Components**: Keep global layout elements (Buttons, Navbars, Footers) in a top-level `components` or `ui` folder.
- **Feature-Specific Components**: Organize feature-specific components in their own domains or feature folders outside of `app` (e.g., `src/features/shop/components`).

### Route Groups
Wrap folders in parentheses like `(marketing)` or `(shop)` to organize routes without affecting the URL path. 
- *Use Case*: You can share a specific `layout.tsx` for multiple routes within a Route Group without changing their URLs.

## 2. SEO & Metadata Optimization

Next.js provides powerful Metadata APIs to automatically generate the relevant `<head>` tags for your pages, significantly improving SEO and web shareability.

### Static Metadata
Export a static `metadata` object from a `layout.tsx` or `page.tsx` file for pages with static content.
```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Store',
  description: 'Shop the latest products',
}
```

### Dynamic Metadata (`generateMetadata`)
For pages that depend on fetched data (like a blog post or a product page), use the `generateMetadata` function. Next.js streams this metadata separately so it doesn't block UI rendering.
```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  
  return {
    title: product.name,
    description: product.description,
  }
}
```
*Note*: If you need to fetch the same data in both `generateMetadata` and your Page component, wrap your fetch function in React's `cache()` to memoize the request and avoid duplicate calls.

### File-based Metadata
Next.js supports special file conventions for SEO assets. You can drop these directly into your route folders:
- **`favicon.ico`, `icon.png`, `apple-icon.jpg`**: For favicons and app icons.
- **`opengraph-image.jpg`, `twitter-image.jpg`**: For static social media share cards.
- **`sitemap.xml`, `robots.txt`**: Placed at the root to guide search engine crawlers.

For dynamic Open Graph (OG) images, Next.js allows you to use `ImageResponse` from `next/og` in a file named `opengraph-image.tsx` to generate images on-the-fly using JSX and CSS.

## 3. Server vs. Client Components

- **Server Components by Default**: By default, Next.js uses React Server Components. Keep components as Server Components whenever possible. They reduce the JavaScript bundle size and improve load times by executing on the server.
- **Client Components when Necessary**: Only add the `"use client"` directive at the top of the file when you need interactivity (e.g., `onClick`, `useState`, `useEffect`), or when using browser-only APIs.
- **Interleaving**: Avoid importing Server Components directly into Client Components. Instead, pass Server Components as `children` or props to Client Components to maintain their server-side benefits.

## 4. Performance & Caching
- Use the built-in `<Image />` component from `next/image` to automatically optimize images (WebP/AVIF formats, responsive resizing, lazy loading).
- Utilize the `Link` component from `next/link` for instant client-side navigation with automatic prefetching of routes in the background.
