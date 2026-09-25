import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import { verifyRole } from '@/lib/dal';

export async function GET() {
  try {
    // 1. Verificación de permisos (solo roles con acceso a reportes financieros)
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

    // 2. Obtener datos
    const invoices = await prisma.purchaseInvoice.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    const zip = new JSZip();

    for (const invoice of invoices) {
      // Nombre de la carpeta del proveedor (reemplazando espacios por _)
      const supplierFolderName = invoice.supplier.name.replace(/\s+/g, '_');
      const supplierFolder = zip.folder(supplierFolderName);

      if (!supplierFolder) continue;

      // Crear archivo Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Factura_${invoice.invoiceNumber}`);

      // Encabezados de la factura
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `Factura de Compra: ${invoice.invoiceNumber}`;
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center' };

      worksheet.addRow(['Proveedor:', invoice.supplier.name, '', 'Fecha:', invoice.date.toLocaleDateString()]);
      worksheet.addRow([]); // Espacio en blanco

      // Columnas para los productos
      worksheet.getRow(4).values = [
        'Código/ID',
        'Producto',
        'Cantidad',
        'Costo Unitario',
        'Descuento',
        'Subtotal'
      ];
      worksheet.getRow(4).font = { bold: true };

      worksheet.columns = [
        { key: 'productId', width: 25 },
        { key: 'productName', width: 40 },
        { key: 'qty', width: 15 },
        { key: 'unitCost', width: 20 },
        { key: 'discount', width: 15 },
        { key: 'subtotal', width: 20 },
      ];

      // Agregar items
      invoice.items.forEach(item => {
        worksheet.addRow({
          productId: item.product.barCode || item.productId,
          productName: item.product.name,
          qty: item.quantity,
          unitCost: Number(item.unitCost),
          discount: item.discountAmount ? Number(item.discountAmount) : 0,
          subtotal: Number(item.subtotal)
        });
      });

      // Filas de totales
      worksheet.addRow([]);
      worksheet.addRow({ productName: 'Subtotal General:', subtotal: Number(invoice.subtotal) }).font = { bold: true };
      if (Number(invoice.discountAmount) > 0) {
        worksheet.addRow({ productName: 'Descuento Total:', subtotal: Number(invoice.discountAmount) }).font = { bold: true };
      }
      worksheet.addRow({ productName: 'IVA:', subtotal: Number(invoice.ivaAmount) }).font = { bold: true };
      worksheet.addRow({ productName: 'TOTAL FACTURA:', subtotal: Number(invoice.grandTotal) }).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      
      // Añadir Excel al zip (ej. Factura_333.xlsx)
      supplierFolder.file(`Factura_${invoice.invoiceNumber}.xlsx`, buffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'uint8array' });

    // 4. Retornar response
    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="Facturas_Compras.zip"',
      },
    });

  } catch (error) {
    console.error('Error exportando facturas:', error);
    return NextResponse.json({ error: 'Error exportando facturas' }, { status: 500 });
  }
}
