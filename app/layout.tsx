import type { Metadata } from "next";
import { Public_Sans, Sora } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "AUTO-TECH - Iniciar Sesión",
  description: "Don Coche login",
};

/**
 * Layout principal de la aplicación Next.js.
 * 
 * Se encarga de envolver a toda la aplicación, configurando el documento HTML base,
 * e inyectando las fuentes tipográficas globales (Public Sans y Sora) a través de
 * variables CSS, así como la carga de Google Material Symbols y estilos CSS globales de Tailwind.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${publicSans.variable} ${sora.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
