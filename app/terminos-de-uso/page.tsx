import Link from 'next/link';

export const metadata = {
  title: 'Términos de Servicio | Don Coche',
};

const sections = [
  {
    icon: 'task_alt',
    title: '1. Aceptación de los Términos',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Al acceder y utilizar el sistema de gestión de Don Coche o cualquiera de nuestros
        servicios presenciales, usted acepta estar sujeto a estos Términos de Servicio y a
        nuestra Política de Privacidad. Si no está de acuerdo con alguna parte de los términos,
        no podrá utilizar nuestros servicios.
      </p>
    ),
  },
  {
    icon: 'directions_car',
    title: '2. Descripción del Servicio',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Don Coche ofrece servicios de lavado y mecánica automotriz, así como una plataforma para
        agendar citas, gestionar órdenes de servicio y recibir notificaciones sobre el estado de
        su vehículo. Los servicios específicos, tiempos de entrega y tarifas se informan al
        momento de la solicitud y pueden variar según el tipo de vehículo y el servicio
        contratado.
      </p>
    ),
  },
  {
    icon: 'edit_note',
    title: '3. Registro y Uso del Servicio',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Usted se compromete a proporcionar información verdadera, exacta y completa al momento de
        registrar sus vehículos y solicitar servicios, incluyendo datos de contacto y
        características del vehículo. Es su responsabilidad mantener esta información
        actualizada. El uso indebido de nuestras instalaciones o de este sistema de gestión será
        causal de terminación de nuestros servicios.
      </p>
    ),
  },
  {
    icon: 'payments',
    title: '4. Precios y Pagos',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Los precios de nuestros servicios se informan previamente a la prestación de los mismos y
        pueden estar sujetos a cambios sin previo aviso, sin afectar servicios ya contratados. El
        pago se realiza a través de los medios habilitados por Don Coche (efectivo, transferencia
        u otros medios electrónicos) y debe completarse antes de la entrega del vehículo, salvo
        acuerdo distinto con la administración.
      </p>
    ),
  },
  {
    icon: 'event_busy',
    title: '5. Cancelaciones y Reprogramaciones',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Usted puede cancelar o reprogramar una cita a través de la plataforma o contactando a
        nuestro equipo de soporte, preferiblemente con anticipación razonable. Las cancelaciones
        de último momento o la inasistencia reiterada podrán limitar su acceso a la reserva de
        citas futuras.
      </p>
    ),
  },
  {
    icon: 'gavel',
    title: '6. Responsabilidad y Uso de la Plataforma',
    content: (
      <div className="space-y-4">
        <p className="text-on-surface-variant leading-relaxed">
          <strong>Sobre los bienes físicos:</strong> Don Coche se esfuerza por brindar servicios de la más 
          alta calidad. Sin embargo, no nos hacemos responsables por objetos de valor dejados en el interior 
          de los vehículos a menos que hayan sido reportados previamente y entregados a la administración 
          para su custodia. Tampoco nos hacemos responsables por daños preexistentes no informados al 
          momento de recibir el vehículo.
        </p>
        <p className="text-on-surface-variant leading-relaxed">
          <strong>Sobre los datos y el sistema:</strong> Toda la información, precios, y datos ingresados 
          en la plataforma son de entera responsabilidad del usuario o administrador que los digita. Por su 
          parte, los errores propios del software (bugs, fallos de código o caídas del sistema) son 
          responsabilidad del equipo desarrollador. En caso de experimentar cualquier error del sistema, 
          el usuario debe comunicarse de inmediato con nuestra área de{' '}
          <Link href="/soporte" className="text-primary-fixed-dim hover:underline underline-offset-2">
            Soporte Técnico
          </Link>{' '}
          para recibir asistencia oportuna.
        </p>
      </div>
    ),
  },
  {
    icon: 'build_circle',
    title: '7. Garantía de los Servicios',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Los servicios de mecánica realizados por Don Coche cuentan con garantía sobre la mano de
        obra por el período informado al momento de la entrega del vehículo. Esta garantía no
        cubre daños derivados del uso inadecuado del vehículo, desgaste normal, o intervenciones
        realizadas por terceros con posterioridad al servicio.
      </p>
    ),
  },
  {
    icon: 'no_crash',
    title: '8. Vehículos No Reclamados',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Si un vehículo no es reclamado dentro de los plazos informados tras la finalización del
        servicio, Don Coche podrá contactar al cliente por los medios registrados y, de ser
        necesario, aplicar cargos adicionales por custodia, conforme a lo permitido por la
        normatividad vigente.
      </p>
    ),
  },
  {
    icon: 'block',
    title: '9. Conducta Prohibida',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Está prohibido el uso fraudulento de la plataforma, la suplantación de identidad, el
        registro de información falsa o cualquier conducta que afecte la seguridad, integridad o
        buen funcionamiento del servicio o de nuestras instalaciones. Don Coche se reserva el
        derecho de suspender el acceso a usuarios que incurran en estas conductas.
      </p>
    ),
  },
  {
    icon: 'copyright',
    title: '10. Propiedad Intelectual',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        El nombre, logotipo, diseño de la plataforma y demás contenidos de Don Coche son de
        propiedad exclusiva de la empresa o de sus licenciantes. Queda prohibida su reproducción o
        uso sin autorización previa y por escrito.
      </p>
    ),
  },
  {
    icon: 'balance',
    title: '11. Ley Aplicable',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Estos Términos de Servicio se rigen por las leyes de la República de Colombia. Cualquier
        controversia derivada de su interpretación o cumplimiento se someterá a los mecanismos de
        resolución de conflictos y a la jurisdicción competente conforme a la ley colombiana.
      </p>
    ),
  },
  {
    icon: 'update',
    title: '12. Modificaciones',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Nos reservamos el derecho de modificar estos Términos de Servicio en cualquier momento.
        Los cambios entrarán en vigencia inmediatamente después de su publicación en esta
        plataforma. Se recomienda revisar esta página periódicamente.
      </p>
    ),
  },
  {
    icon: 'support_agent',
    title: '13. Contacto',
    content: (
      <p className="text-on-surface-variant leading-relaxed">
        Si tiene preguntas sobre estos Términos de Servicio, puede comunicarse con nuestro equipo
        a través de{' '}
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

export default function TermsOfUsePage() {
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
                description
              </span>
            </span>
            <h1 className="font-headline-lg text-on-surface">Términos de Servicio</h1>
          </div>
          <p className="text-sm text-on-surface-variant ml-14">
            Última actualización:{' '}
            {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <p className="text-on-surface-variant text-body-md leading-relaxed mb-stack-lg pb-stack-md border-b border-outline-variant/30">
          Estos Términos de Servicio regulan el uso de la plataforma y de los servicios de lavado
          y mecánica ofrecidos por Don Coche. Le recomendamos leerlos detenidamente antes de
          utilizar nuestros servicios.
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
