import Link from 'next/link';

export const metadata = {
  title: 'Soporte Técnico | Don Coche',
};

export default function SoportePage() {
  return (
    <div className="antialiased min-h-screen bg-background text-on-background flex flex-col fade-in">
      <header className="w-full flex justify-between items-center p-4 border-b border-outline-variant/30 bg-surface">
        <Link
          href="/"
          className="font-label-bold text-on-surface hover:text-primary-fixed-dim transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Volver
        </Link>
        <span className="font-headline-sm text-on-surface">Don Coche</span>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-margin-mobile md:p-margin-desktop my-stack-xl bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/30 flex flex-col items-center text-center">
        {/* Icono destacado con fondo circular */}
        <div className="w-20 h-20 rounded-full bg-primary-fixed-dim/10 flex items-center justify-center mb-stack-md">
          <span className="material-symbols-outlined text-5xl text-primary-fixed-dim">
            support_agent
          </span>
        </div>

        <h1 className="font-headline-lg text-on-surface mb-2">Soporte Técnico</h1>
        <div className="w-12 h-1 rounded-full bg-primary-fixed-dim/40 mb-stack-md" />

        <p className="text-on-surface-variant text-body-lg mb-stack-lg max-w-2xl leading-relaxed">
          ¿Necesitas ayuda con el sistema de Don Coche? Nuestro equipo de soporte está disponible
          para resolver cualquier inconveniente técnico o duda que tengas sobre la plataforma.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md w-full max-w-2xl text-left">
          <div className="group bg-surface p-stack-md rounded-lg border border-outline-variant/30 flex flex-col gap-2 transition-all hover:border-primary-fixed-dim/40 hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-primary-fixed-dim/10 flex items-center justify-center shrink-0 group-hover:bg-primary-fixed-dim/20 transition-colors">
                <span className="material-symbols-outlined text-primary-fixed-dim text-xl">
                  mail
                </span>
              </span>
              <h3 className="font-headline-sm text-on-surface">Correo Electrónico</h3>
            </div>
            <p className="text-body-md text-on-surface-variant ml-12">
              <a
                href="mailto:hello.veltrix@gmail.com"
                className="hover:text-primary-fixed-dim transition-colors underline-offset-2 hover:underline"
              >
                hello.veltrix@gmail.com
              </a>
              <br />
              <span className="text-sm">Respuesta en menos de 24h</span>
            </p>
          </div>

          <div className="group bg-surface p-stack-md rounded-lg border border-outline-variant/30 flex flex-col gap-2 transition-all hover:border-primary-fixed-dim/40 hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-primary-fixed-dim/10 flex items-center justify-center shrink-0 group-hover:bg-primary-fixed-dim/20 transition-colors">
                <span className="material-symbols-outlined text-primary-fixed-dim text-xl">
                  call
                </span>
              </span>
              <h3 className="font-headline-sm text-on-surface">Línea Telefónica</h3>
            </div>
            <p className="text-body-md text-on-surface-variant ml-12">
              <a
                href="tel:+573018502050"
                className="hover:text-primary-fixed-dim transition-colors underline-offset-2 hover:underline"
              >
                +57 301 840 2050
              </a>
              <br />
              <span className="text-sm">Lun - Sáb: 8:00 AM - 6:00 PM</span>
            </p>
          </div>
        </div>

        <div className="mt-stack-xl md:mt-20 flex flex-col items-center gap-2">
          <a
            href="https://wa.me/573018402050"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] text-white font-cta text-label-bold px-8 py-3 rounded-full shadow-sm hover:bg-[#1DA851] hover:shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">chat</span>
            Contactar por WhatsApp
          </a>
          <span className="text-sm text-on-surface-variant">
            Te respondemos lo antes posible
          </span>
        </div>
      </main>

      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 p-margin-mobile md:px-margin-desktop flex justify-center mt-auto">
        <span className="text-body-md text-on-secondary-container">
          © {new Date().getFullYear()} Don Coche. Todos los derechos reservados.
        </span>
      </footer>
    </div>
  );
}
