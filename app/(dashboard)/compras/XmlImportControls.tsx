"use client";

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export function XmlImportControls() {
  const showInfo = () => {
    MySwal.fire({
      title: '¿Qué es la importación por XML?',
      html: `
        <div class="text-left space-y-4 text-secondary">
          <p>
            El archivo <b>XML (Extensible Markup Language)</b> es un formato estándar utilizado por la DIAN en Colombia para la facturación electrónica. Contiene toda la información detallada de la factura de forma estructurada.
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li><b>Datos Legales:</b> NIT, razón social y datos fiscales del proveedor y tu empresa.</li>
            <li><b>Desglose de Productos:</b> Códigos, cantidades, valores unitarios y costos totales.</li>
            <li><b>Impuestos:</b> IVA desglosado, retenciones y descuentos aplicados.</li>
            <li><b>Validez:</b> CUFE (Código Único de Facturación Electrónica) que certifica su validez ante la DIAN.</li>
          </ul>
          <p class="font-medium text-primary">
            Importar este archivo te ahorrará el proceso de digitar manualmente cada producto y calcular sus impuestos, eliminando cualquier margen de error humano.
          </p>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#ffc107',
      confirmButtonText: 'Entendido'
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative group">
        <button
          type="button"
          disabled
          className="flex items-center gap-2 bg-surface-container-high text-secondary px-6 py-3 rounded-full font-medium shadow-sm opacity-60 cursor-not-allowed border border-outline-variant"
        >
          <span className="material-symbols-outlined text-[20px]">document_scanner</span>
          Leer XML
        </button>
        {/* Tooltip flotante */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-on-surface text-surface text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
          No implementado aún
        </div>
      </div>
      
      <button
        type="button"
        onClick={showInfo}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container hover:brightness-95 transition-colors cursor-pointer shadow-sm"
        title="¿Qué es el XML?"
      >
        <span className="material-symbols-outlined text-[20px]">question_mark</span>
      </button>
    </div>
  );
}
