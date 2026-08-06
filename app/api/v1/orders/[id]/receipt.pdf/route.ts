import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        vehicle: { include: { customer: true } },
        technician: true,
        admin: true,
        services: { include: { service: true } },
        products: { include: { product: true } },
      }
    });

    if (!order) {
      return new NextResponse('Orden no encontrada', { status: 404 });
    }

    if (order.status !== 'FACTURADA') {
      return new NextResponse('La orden aún no ha sido facturada', { status: 400 });
    }

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 30, size: [226.77, 800] }); // 80mm width roughly, POS receipt size

    const chunks: Uint8Array[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    // Generar contenido del PDF
    doc.fontSize(14).font('Helvetica-Bold').text('DON COCHE S.A.S.', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('NIT: 902.087.049-6', { align: 'center' });
    doc.text('TV 9 58N 68 - Popayán, Cauca', { align: 'center' });
    doc.text('Tel: 310 490 4579', { align: 'center' });
    doc.text('doncochepopayan@gmail.com', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text(`Recibo #${String(order.orderNumber).padStart(4, '0')}`, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Fecha: ${order.billedAt ? order.billedAt.toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO')}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).font('Helvetica-Bold').text('Cliente:', { continued: true }).font('Helvetica').text(` ${order.vehicle.customer?.name || 'Consumidor Final'}`);
    doc.font('Helvetica-Bold').text('CC:', { continued: true }).font('Helvetica').text(` ${order.vehicle.customer?.cc || 'N/A'}`);
    doc.font('Helvetica-Bold').text('Placa:', { continued: true }).font('Helvetica').text(` ${order.vehicle.plate}`);
    doc.font('Helvetica-Bold').text('Técnico:', { continued: true }).font('Helvetica').text(` ${order.technician?.name || 'N/A'}`);
    doc.font('Helvetica-Bold').text('Cajero:', { continued: true }).font('Helvetica').text(` ${order.admin?.name || 'N/A'}`);
    doc.moveDown();

    // Separador
    doc.text('------------------------------------------', { align: 'center' });

    if (order.services.length > 0) {
      doc.font('Helvetica-Bold').text('SERVICIOS:');
      order.services.forEach(os => {
        doc.font('Helvetica').text(`${os.service?.name || 'Servicio'}`);
        doc.text(`$${Number(os.chargedPrice).toLocaleString('es-CO')}`, { align: 'right' });
      });
      doc.moveDown(0.5);
    }

    if (order.products.length > 0) {
      doc.font('Helvetica-Bold').text('REPUESTOS:');
      order.products.forEach(op => {
        doc.font('Helvetica').text(`${op.quantity}x ${op.product?.name || 'Producto'} ($${Number(op.unitPrice).toLocaleString('es-CO')})`);
        doc.text(`$${(Number(op.quantity) * Number(op.unitPrice)).toLocaleString('es-CO')}`, { align: 'right' });
      });
      doc.moveDown(0.5);
    }

    doc.text('------------------------------------------', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('TOTAL: ', { continued: true }).text(`$${Number(order.grandTotal).toLocaleString('es-CO')}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(10).font('Helvetica').text('Método de pago: ', { continued: true }).text(`${order.paymentMethod}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(10).font('Helvetica-Bold').text('¡Gracias por su visita!', { align: 'center' });

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Factura_Orden_${order.orderNumber}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('Error al generar PDF de factura:', error);
    return new NextResponse('Error al generar factura', { status: 500 });
  }
}
