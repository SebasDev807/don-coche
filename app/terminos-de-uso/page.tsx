import Link from 'next/link';

export const metadata = {
  title: 'Términos de Servicio | Don Coche',
};

export default function TerminosPage() {
  return (
    <div className="antialiased min-h-screen bg-background text-on-background flex flex-col fade-in">
      <header className="w-full flex justify-between items-center p-4 border-b border-outline-variant/30 bg-surface">
        <Link href="/" className="font-label-bold text-on-surface hover:text-primary-fixed-dim transition-colors">
          &larr; Volver
        </Link>
        <span className="font-headline-sm text-on-surface">Don Coche</span>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-margin-mobile md:p-margin-desktop my-stack-xl bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/30">
        <h1 className="font-headline-lg text-primary-fixed-dim mb-stack-lg">Términos de Servicio</h1>
        
        <div className="space-y-stack-md text-body-md text-on-surface">
          <section>
            <h2 className="font-headline-sm text-on-surface mb-stack-xs">1. Aceptación de los Términos</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Al acceder y utilizar el sistema de gestión de Don Coche o cualquiera de nuestros servicios presenciales, usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguna parte de los términos, no podrá utilizar nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="font-headline-sm text-on-surface mb-stack-xs">2. Uso del Servicio</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Usted se compromete a proporcionar información verdadera, exacta y completa al momento de registrar sus vehículos y solicitar servicios. Asimismo, el uso indebido de nuestras instalaciones o de este sistema de gestión será causal de terminación de nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="font-headline-sm text-on-surface mb-stack-xs">3. Responsabilidad</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Don Coche se esfuerza por brindar servicios de la más alta calidad. Sin embargo, no nos hacemos responsables por objetos de valor dejados en el interior de los vehículos a menos que hayan sido reportados previamente y entregados a la administración para su custodia.
            </p>
          </section>

          <section>
            <h2 className="font-headline-sm text-on-surface mb-stack-xs">4. Modificaciones</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Nos reservamos el derecho de modificar estos Términos de Servicio en cualquier momento. Los cambios entrarán en vigencia inmediatamente después de su publicación en esta plataforma. Se recomienda revisar esta página periódicamente.
            </p>
          </section>
        </div>
      </main>

      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 p-margin-mobile md:px-margin-desktop flex justify-center mt-auto">
        <span className="text-body-md text-on-secondary-container">© {new Date().getFullYear()} Don Coche. Todos los derechos reservados.</span>
      </footer>
    </div>
  );
}
