"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export function ExportZipButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    MySwal.fire({
      title: 'Generando ZIP...',
      text: 'Por favor espera mientras generamos y comprimimos las facturas.',
      allowOutsideClick: false,
      didOpen: () => {
        MySwal.showLoading();
      }
    });

    try {
      const response = await fetch('/api/purchases/export-zip');
      
      if (!response.ok) {
        throw new Error('Error al generar el ZIP');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Facturas_Compras.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      MySwal.fire({
        icon: 'success',
        title: '¡Descarga completada!',
        text: 'Las facturas se han exportado correctamente.',
        confirmButtonColor: '#16a34a'
      });
    } catch (error) {
      console.error(error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un problema al descargar las facturas.',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="btn-secondary flex items-center justify-center gap-2 px-6 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {isExporting ? (
        <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
      ) : (
        <span className="material-symbols-outlined text-[20px]">folder_zip</span>
      )}
      Descargar ZIP
    </button>
  );
}
