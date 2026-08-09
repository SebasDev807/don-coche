import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidad | Don Coche',
};

const sections = [
  {
    icon: 'badge',
    title: '1. Información que Recopilamos',
    content: (
      <>
        <p className="text-on-surface-variant leading-relaxed">
          En Don Coche recopilamos información personal necesaria para la prestación de nuestros
          servicios de lavado y mecánica. Esto puede incluir:
        </p>
        <ul className="list-disc list-inside text-on-surface-variant leading-relaxed mt-2 space-y-1 ml-1">
          <li>Datos de identificación: nombre completo y número de identificación (CC).</li>
          <li>Datos de contacto: correo electrónico y número de teléfono.</li>
          <li>Datos del vehículo: placa, marca, modelo y kilometraje.</li>
          <li>Historial de servicios y órdenes realizadas en la plataforma.</li>
          <li>Información de pago, procesada de forma segura por nuestras pasarelas de pago.</li>
        </ul>
      </>
    ),
  },
  {
    icon: 'settings',
    title: '2. Uso de la Información',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        La información recopilada se utiliza exclusivamente para gestionar sus órdenes de
        servicio, enviarle notificaciones importantes (como recibos, confirmaciones de citas o
        recordatorios de mantenimiento), procesar pagos, mejorar la calidad de nuestra atención y,
        cuando usted lo autorice, enviarle comunicaciones sobre promociones o novedades.
      </p>
    ),
  },
  {
    icon: 'gavel',
    title: '3. Base Legal del Tratamiento',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Tratamos sus datos personales con fundamento en su consentimiento previo, expreso e
        informado, en la ejecución del contrato de prestación de servicios que usted acepta al
        usar la plataforma, y en el cumplimiento de obligaciones legales aplicables, conforme a la
        Ley 1581 de 2012 y demás normas de protección de datos personales en Colombia.
      </p>
    ),
  },
  {
    icon: 'share',
    title: '4. Compartición con Terceros',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Sus datos no serán vendidos, alquilados ni compartidos con terceros con fines comerciales
        distintos a los aquí descritos. Podemos compartir información limitada con proveedores que
        nos ayudan a operar la plataforma (por ejemplo, pasarelas de pago o herramientas de
        mensajería como WhatsApp), quienes están obligados a proteger sus datos, o cuando la ley
        así lo requiera.
      </p>
    ),
  },
  {
    icon: 'schedule',
    title: '5. Conservación de los Datos',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Conservamos su información personal durante el tiempo necesario para cumplir con las
        finalidades descritas en esta política y con las obligaciones legales, contables o
        fiscales aplicables. Una vez cumplidas dichas finalidades, sus datos serán eliminados o
        anonimizados de forma segura.
      </p>
    ),
  },
  {
    icon: 'lock',
    title: '6. Protección de Datos',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Implementamos medidas de seguridad técnicas, administrativas y organizativas para proteger
        su información personal contra accesos no autorizados, pérdida, alteración o divulgación
        indebida. Sin embargo, ningún sistema es completamente infalible, por lo que le
        recomendamos mantener sus credenciales de acceso en un lugar seguro.
      </p>
    ),
  },
  {
    icon: 'cookie',
    title: '7. Cookies y Tecnologías Similares',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Nuestra plataforma puede utilizar cookies u otras tecnologías similares para recordar sus
        preferencias, mantener su sesión activa y analizar el uso del sitio con el fin de mejorar
        la experiencia del usuario. Usted puede configurar su navegador para rechazar estas
        tecnologías, aunque esto podría afectar algunas funcionalidades.
      </p>
    ),
  },
  {
    icon: 'child_care',
    title: '8. Menores de Edad',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Nuestros servicios están dirigidos a personas mayores de edad. No recopilamos
        intencionalmente información personal de menores de edad. Si tiene conocimiento de que un
        menor nos ha proporcionado datos personales, por favor contáctenos para proceder con su
        eliminación.
      </p>
    ),
  },
  {
    icon: 'fact_check',
    title: '9. Sus Derechos (Habeas Data)',
    content: (
      <>
        <p className="text-on-surface-variant leading-relaxed">
          Como titular de sus datos personales, usted tiene derecho a:
        </p>
        <ul className="list-disc list-inside text-on-surface-variant leading-relaxed mt-2 space-y-1 ml-1">
          <li>Conocer, actualizar y rectificar sus datos personales.</li>
          <li>Solicitar prueba de la autorización otorgada para el tratamiento de sus datos.</li>
          <li>Ser informado sobre el uso que se ha dado a sus datos personales.</li>
          <li>Presentar quejas ante la autoridad competente por infracciones a la ley.</li>
          <li>Revocar la autorización y/o solicitar la supresión de sus datos, cuando proceda.</li>
          <li>Acceder de forma gratuita a sus datos personales tratados.</li>
        </ul>
      </>
    ),
  },
  {
    icon: 'update',
    title: '10. Cambios a esta Política',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en
        nuestras prácticas o por motivos legales, operativos o regulatorios. Le notificaremos
        cualquier cambio relevante publicando la nueva versión en esta página, con su
        correspondiente fecha de actualización.
      </p>
    ),
  },
  {
    icon: 'support_agent',
    title: '11. Contacto',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Si desea ejercer sus derechos o tiene alguna pregunta sobre esta política, puede
        comunicarse con nuestro equipo de soporte a través de{' '}
        <a
          href="mailto:hello.veltrix@gmail.com"
          className="text-primary-fixed-dim hover:underline underline-offset-2"
        >
          hello.veltrix@gmail.com
        </a>{' '}
        o visitando nuestra{' '}
        <Link href="/soporte" className="text-primary-fixed-dim hover:underline underline-offset-2">
          página de soporte técnico
        </Link>
        .
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
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

      <main className="flex-1 max-w-4xl w-full mx-auto p-margin-mobile md:p-margin-desktop my-stack-xl bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/30">
        <div className="mb-stack-lg">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-11 h-11 rounded-full bg-primary-fixed-dim/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">
                shield_person
              </span>
            </span>
            <h1 className="font-headline-lg text-on-surface">Política de Privacidad</h1>
          </div>
          <p className="text-sm text-on-surface-variant ml-14">
            Última actualización:{' '}
            {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <p className="text-on-surface-variant text-body-md leading-relaxed mb-stack-lg pb-stack-md border-b border-outline-variant/30">
          En Don Coche valoramos y respetamos su privacidad. Esta política explica de forma clara
          qué información recopilamos, cómo la usamos y cuáles son sus derechos sobre sus datos
          personales al utilizar nuestra plataforma de servicios de lavado y mecánica.
        </p>

        <div className="space-y-stack-lg text-body-md text-on-surface">
          {sections.map((section) => (
            <section key={section.title} className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-stack-xs">
                <span className="w-8 h-8 rounded-full bg-primary-fixed-dim/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary-fixed-dim text-base">
                    {section.icon}
                  </span>
                </span>
                <h2 className="font-headline-sm text-on-surface">{section.title}</h2>
              </div>
              <div className="ml-11">{section.content}</div>
            </section>
          ))}
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