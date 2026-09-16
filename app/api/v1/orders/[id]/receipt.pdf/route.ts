import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';

const BUSINESS = {
  name: 'DON COCHE S.A.S.',
  legal: 'Don Coche Lavadero & Serviteca',
  nit: '902.087.049-6',
  address: 'TV 9 58N 68',
  city: 'Popayán, Cauca',
  phone: '310 490 4579',
  tagline: '¡Gracias por su preferencia!',
};

function fmtCOP(val: number): string {
  return `$${Math.round(val).toLocaleString('es-CO')}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    let order: any = await prisma.order.findUnique({
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
      const sale = await prisma.productSale.findUnique({
        where: { id },
        include: {
          admin: true,
          items: { include: { product: true } }
        }
      });
      
      if (!sale) {
        return new NextResponse('Orden o venta no encontrada', { status: 404 });
      }

      order = {
        orderNumber: `V-${sale.saleNumber}`,
        type: 'VENTA_ALMACEN',
        status: 'FACTURADA',
        billedAt: sale.soldAt,
        paymentMethod: sale.paymentMethod,
        totalServices: 0,
        grandTotal: sale.grandTotal,
        vehicle: {
          plate: null,
          customer: { name: sale.customerName || 'Consumidor Final', cc: sale.customerCc }
        },
        technician: null,
        admin: { name: sale.admin.name },
        services: [],
        products: sale.items.map(i => ({
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          product: {
            name: i.product.name,
            iva: Number(i.ivaRate) > 0 ? Number(i.ivaRate) : 0
          }
        }))
      };
    }

    if (order.status !== 'FACTURADA') {
      return new NextResponse('La orden aún no ha sido facturada', { status: 400 });
    }

    // Dimensiones 80mm: 226.77pt (a 72dpi). Usamos margen estrecho.
    const doc = new PDFDocument({ margin: 14, size: [226.77, 800] });

    const chunks: Uint8Array[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    const W = 226.77 - 14 * 2; // ancho útil
    const x0 = 14;

    // ─── HEADER ───
    doc
      .fontSize(13).font('Helvetica-Bold')
      .text(BUSINESS.name, x0, 14, { width: W, align: 'center' });
    doc
      .fontSize(8.5).font('Helvetica-Bold')
      .text(BUSINESS.legal, { width: W, align: 'center' })
      .text(`NIT: ${BUSINESS.nit}`, { width: W, align: 'center' })
      .text(BUSINESS.address, { width: W, align: 'center' })
      .text(`Tel: ${BUSINESS.phone} — ${BUSINESS.city}`, { width: W, align: 'center' });

    doc.moveDown(0.5);

    // Separador
    const dashLine = () => {
      doc.font('Helvetica-Bold').fontSize(8)
        .text('- - - - - - - - - - - - - - - - - - - - - -', x0, doc.y, { width: W, align: 'center' });
    };

    dashLine();
    doc.moveDown(0.3);

    // ─── TIPO Y NÚMERO ───
    const orderLabel = order.type === 'VENTA_ALMACEN'
      ? `VENTA ALMACEN #${String(order.orderNumber).padStart(4, '0')}`
      : `ORDEN #${String(order.orderNumber).padStart(4, '0')}`;

    doc.fontSize(11).font('Helvetica-Bold').text(orderLabel, x0, doc.y, { width: W, align: 'center' });

    const billedDate = order.billedAt
      ? new Date(order.billedAt).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
      : new Date().toLocaleString('es-CO');
    doc.fontSize(8.5).font('Helvetica-Bold').text(billedDate, x0, doc.y, { width: W, align: 'center' });

    doc.moveDown(0.3);
    dashLine();
    doc.moveDown(0.3);

    // ─── DATOS CLIENTE / VEHÍCULO ───
    const rowKV = (label: string, value: string) => {
      if (!value || value === 'null' || value === 'undefined') return;
      const labelW = 58;
      const valW = W - labelW;
      const yStart = doc.y;
      doc.fontSize(9).font('Helvetica-Bold').text(`${label}:`, x0, yStart, { width: labelW });
      doc.fontSize(9).font('Helvetica-Bold').text(value, x0 + labelW, yStart, { width: valW });
    };

    const rawPlate = order.vehicle?.plate;
    if (rawPlate && rawPlate !== 'GEN-000' && rawPlate !== 'ALMACÉN') {
      rowKV('Placa', rawPlate);
    }
    const vehicleDesc = [order.vehicle?.brand, order.vehicle?.model, order.vehicle?.color]
      .filter(Boolean).join(' ');
    if (vehicleDesc) rowKV('Vehículo', vehicleDesc);
    if (order.vehicle?.customer?.name) rowKV('Cliente', order.vehicle.customer.name);
    if (order.vehicle?.customer?.cc) rowKV('CC/NIT', order.vehicle.customer.cc);
    rowKV('Técnico', order.technician?.name || order.admin?.name || 'N/A');
    if (order.admin) rowKV('Cajero', order.admin.name);

    doc.moveDown(0.3);
    dashLine();
    doc.moveDown(0.3);

    // ─── SERVICIOS ───
    if (order.services.length > 0) {
      doc.fontSize(9.5).font('Helvetica-Bold').text('SERVICIOS', x0, doc.y, { width: W });
      doc.moveDown(0.2);
      let totalServices = 0;
      for (const os of order.services) {
        totalServices += Number(os.chargedPrice);
        const price = fmtCOP(Number(os.chargedPrice));
        const priceW = doc.widthOfString(price) + 2;
        const nameW = W - priceW;
        const yRow = doc.y;
        doc.fontSize(9).font('Helvetica-Bold')
          .text(`- ${os.service?.name || 'Servicio'}`, x0, yRow, { width: nameW });
        doc.fontSize(9).font('Helvetica-Bold')
          .text(price, x0 + nameW, yRow, { width: priceW, align: 'right' });
        doc.moveDown(0.15);
      }
      doc.moveDown(0.3);
      dashLine();
      doc.moveDown(0.3);
    }

    // ─── PRODUCTOS ───
    let trueIvaTotal = 0;
    let productsSubtotal = 0;

    if (order.products.length > 0) {
      doc.fontSize(9.5).font('Helvetica-Bold').text('REPUESTOS / PRODUCTOS', x0, doc.y, { width: W });
      doc.moveDown(0.2);

      for (const op of order.products) {
        const unitPrice = Number(op.unitPrice);
        const quantity = Number(op.quantity);
        const ivaRate = op.product?.iva ? Number(op.product.iva) / 100 : 0;
        const basePriceUnit = ivaRate > 0 ? unitPrice / (1 + ivaRate) : unitPrice;
        const ivaAmountUnit = unitPrice - basePriceUnit;

        trueIvaTotal += ivaAmountUnit * quantity;
        productsSubtotal += basePriceUnit * quantity;

        const lineTotal = fmtCOP(quantity * unitPrice);
        const totalW = doc.widthOfString(lineTotal) + 2;
        const nameW = W - totalW;

        const yRow = doc.y;
        doc.fontSize(9).font('Helvetica-Bold')
          .text(`- ${op.product?.name || 'Producto'}`, x0, yRow, { width: nameW });
        doc.fontSize(9).font('Helvetica-Bold')
          .text(lineTotal, x0 + nameW, yRow, { width: totalW, align: 'right' });
        doc.moveDown(0.15);

        // Detalle IVA
        const ivaDetail = ivaRate > 0
          ? `${quantity} und x ${fmtCOP(unitPrice)} | Base: ${fmtCOP(basePriceUnit)} + IVA(${Number(op.product.iva)}%): ${fmtCOP(ivaAmountUnit)}`
          : `${quantity} und x ${fmtCOP(unitPrice)} | IVA: 0%`;
        doc.fontSize(7.5).font('Helvetica-Bold').text(ivaDetail, x0 + 6, doc.y, { width: W - 6 });
        doc.moveDown(0.25);
      }

      doc.moveDown(0.2);
      dashLine();
      doc.moveDown(0.3);
    }

    // ─── TOTALES ───
    const totalServices = Number(order.totalServices) || 0;
    const subtotal = totalServices + productsSubtotal;

    const totalRow = (label: string, val: string, big = false) => {
      const labelW = W * 0.6;
      const valW = W * 0.4;
      const yRow = doc.y;
      const fs = big ? 12 : 9;
      doc.fontSize(fs).font('Helvetica-Bold').text(label, x0, yRow, { width: labelW });
      doc.fontSize(fs).font('Helvetica-Bold').text(val, x0 + labelW, yRow, { width: valW, align: 'right' });
      doc.moveDown(0.2);
    };

    totalRow('Subtotal', fmtCOP(subtotal));
    if (trueIvaTotal > 0) {
      totalRow('IVA', fmtCOP(trueIvaTotal));
    }
    doc.moveDown(0.2);
    dashLine();
    totalRow('TOTAL', fmtCOP(Number(order.grandTotal)), true);
    dashLine();
    doc.moveDown(0.2);
    totalRow('Método de Pago', order.paymentMethod || 'N/A');

    doc.moveDown(0.5);
    dashLine();
    doc.moveDown(0.4);

    // ─── FOOTER ───
    if (order.admin) {
      doc.fontSize(8.5).font('Helvetica-Bold')
        .text(`Atendido por: ${order.admin.name}`, x0, doc.y, { width: W, align: 'center' });
    }
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold').text(BUSINESS.tagline, x0, doc.y, { width: W, align: 'center' });

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Recibo_${order.orderNumber}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('Error al generar PDF de factura:', error);
    return new NextResponse('Error al generar factura', { status: 500 });
  }
}
