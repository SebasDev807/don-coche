"use client";

import { useState } from "react";
import ExcelJS from "exceljs";
import Link from "next/link";

export function ComprasClient({ invoices }: { invoices: any[] }) {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const handleExportExcel = async (invoice: any) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Factura ${invoice.invoiceNumber}`);

    // Header
    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = `Detalle de Factura de Compra - ${invoice.invoiceNumber}`;
    sheet.getCell('A1').font = { size: 14, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.getCell('A3').value = "Proveedor:";
    sheet.getCell('B3').value = invoice.supplier.name;
    sheet.getCell('A4').value = "NIT:";
    sheet.getCell('B4').value = invoice.supplier.nit;
    sheet.getCell('A5').value = "Fecha:";
    sheet.getCell('B5').value = new Date(invoice.date).toLocaleDateString();
    sheet.getCell('A6').value = "Registrado por:";
    sheet.getCell('B6').value = invoice.admin.name;

    // Items table header
    sheet.getRow(8).values = ['Producto', 'Cantidad', 'Costo Unitario', 'Costo Unit. + IVA', 'IVA (%)', 'Subtotal'];
    sheet.getRow(8).font = { bold: true };
    sheet.getRow(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Items
    let currentRow = 9;
    invoice.items.forEach((item: any) => {
      const ivaRate = item.product?.iva != null ? Number(item.product.iva) : 19;
      const unitWithIva = item.unitCost * (1 + ivaRate / 100);
      sheet.getRow(currentRow).values = [
        item.product.name,
        item.quantity,
        item.unitCost,
        unitWithIva,
        `${ivaRate}%`,
        item.subtotal
      ];
      sheet.getCell(`C${currentRow}`).numFmt = '"$"#,##0.00';
      sheet.getCell(`D${currentRow}`).numFmt = '"$"#,##0.00';
      sheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center' };
      sheet.getCell(`F${currentRow}`).numFmt = '"$"#,##0.00';
      currentRow++;
    });

    // Totals
    currentRow++;
    sheet.getCell(`E${currentRow}`).value = "Gran Total:";
    sheet.getCell(`E${currentRow}`).font = { bold: true };
    sheet.getCell(`F${currentRow}`).value = invoice.grandTotal;
    sheet.getCell(`F${currentRow}`).font = { bold: true };
    sheet.getCell(`F${currentRow}`).numFmt = '"$"#,##0.00';

    sheet.columns = [
      { width: 35 },
      { width: 12 },
      { width: 18 },
      { width: 20 },
      { width: 12 },
      { width: 20 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Factura_${invoice.invoiceNumber}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="bg-surface-container rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-outline-variant">
                <th className="p-4 font-medium text-secondary">Fecha</th>
                <th className="p-4 font-medium text-secondary">Factura #</th>
                <th className="p-4 font-medium text-secondary">Proveedor</th>
                <th className="p-4 font-medium text-secondary text-center">Ítems</th>
                <th className="p-4 font-medium text-secondary text-right">Total</th>
                <th className="p-4 font-medium text-secondary">Registrado por</th>
                <th className="p-4 font-medium text-secondary text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {invoices.map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-surface/50 transition-colors">
                  <td className="p-4 text-body-md whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary">calendar_month</span>
                      {new Date(invoice.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">receipt</span>
                      {invoice.invoiceNumber}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary">domain</span>
                      <span className="font-medium">{invoice.supplier.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded-md text-body-sm font-medium">
                      {invoice._count.items}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium text-title-md">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(invoice.grandTotal)}
                  </td>
                  <td className="p-4 text-body-sm text-secondary">
                    {invoice.admin.name}
                  </td>
                  <td className="p-4 flex items-center justify-center gap-2">
                    <button 
                      onClick={() => setSelectedInvoice(invoice)}
                      className="p-2 rounded-full hover:bg-surface-container-high text-secondary hover:text-primary transition-colors"
                      title="Ver Detalles"
                    >
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                    <Link
                      href={`/compras/editar/${invoice.id}`}
                      className="p-2 rounded-full hover:bg-surface-container-high text-secondary hover:text-primary transition-colors"
                      title="Editar Compra"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </Link>
                    <button 
                      onClick={() => handleExportExcel(invoice)}
                      className="p-2 rounded-full hover:bg-surface-container-high text-secondary hover:text-[#107C41] transition-colors"
                      title="Exportar a Excel"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-surface rounded-3xl p-8 max-w-3xl w-full shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-outline-variant pb-4">
              <h2 className="text-headline-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span> 
                Detalles de Factura
              </h2>
              <button type="button" onClick={() => setSelectedInvoice(null)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="bg-surface-container rounded-xl p-6 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-secondary text-sm block mb-1">Proveedor</span>
                  <span className="font-medium">{selectedInvoice.supplier.name}</span>
                </div>
                <div>
                  <span className="text-secondary text-sm block mb-1">NIT</span>
                  <span className="font-medium">{selectedInvoice.supplier.nit}</span>
                </div>
                <div>
                  <span className="text-secondary text-sm block mb-1">Factura No.</span>
                  <span className="font-medium">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-secondary text-sm block mb-1">Fecha</span>
                  <span className="font-medium">{new Date(selectedInvoice.date).toLocaleDateString()}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-secondary text-sm block mb-1">Registrado por</span>
                  <span className="font-medium">{selectedInvoice.admin.name}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-body-lg mb-3">Artículos ({selectedInvoice.items.length})</h4>
                <div className="bg-surface-container rounded-xl overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-surface-container-high sticky top-0">
                        <tr>
                          <th className="p-3 text-xs text-secondary font-medium uppercase">Producto</th>
                          <th className="p-3 text-xs text-secondary font-medium uppercase text-center">Cant</th>
                          <th className="p-3 text-xs text-secondary font-medium uppercase text-right">Costo Unit</th>
                          <th className="p-3 text-xs text-secondary font-medium uppercase text-right">Costo Unit + IVA</th>
                          <th className="p-3 text-xs text-secondary font-medium uppercase text-center">IVA</th>
                          <th className="p-3 text-xs text-secondary font-medium uppercase text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30">
                        {selectedInvoice.items.map((item: any, idx: number) => {
                          const ivaRate = item.product?.iva != null ? Number(item.product.iva) : 19;
                          const unitWithIva = item.unitCost * (1 + ivaRate / 100);
                          return (
                            <tr key={idx} className="hover:bg-surface-container-high transition-colors">
                              <td className="p-3 text-sm">{item.product.name}</td>
                              <td className="p-3 text-sm text-center font-medium">{item.quantity}</td>
                              <td className="p-3 text-sm text-right text-secondary">${item.unitCost.toLocaleString('es-CO')}</td>
                              <td className="p-3 text-sm text-right font-medium text-on-surface">${unitWithIva.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                              <td className="p-3 text-sm text-center text-secondary">{ivaRate}%</td>
                              <td className="p-3 text-sm text-right font-medium">${item.subtotal.toLocaleString('es-CO')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-primary-container/20 rounded-xl p-6 flex flex-col gap-2 text-right">
                <div className="flex justify-between text-secondary">
                  <span>Subtotal:</span>
                  <span>${selectedInvoice.subtotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-headline-sm font-bold text-primary mt-2 pt-2 border-t border-outline-variant/50">
                  <span>Total Pagado:</span>
                  <span>${selectedInvoice.grandTotal.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => handleExportExcel(selectedInvoice)} className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-outline-variant text-[#107C41] font-bold hover:bg-surface-container cursor-pointer transition-colors">
                <span className="material-symbols-outlined">download</span> Descargar Excel
              </button>
              <button onClick={() => setSelectedInvoice(null)} className="px-6 py-3 rounded-full bg-[#FFF9C4] text-black font-bold hover:bg-[#FFF59D] shadow-md cursor-pointer transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
