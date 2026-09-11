'use server';

import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/dal';
import { revalidatePath } from 'next/cache';
import { PaymentMethod, ItemCategory } from '@prisma/client';
import { AliaddoService, AliaddoInvoicePayload } from '@/lib/services/aliaddo';

/** Buscar vehículo por placa (accesible para admin/gerente en punto de venta) */
export async function searchVehicleByPlate(plate: string) {
  try {
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);
    const vehicle = await prisma.vehicle.findUnique({
      where: { plate: plate.toUpperCase().trim() },
      include: { customer: true },
    });
    return { success: true, data: vehicle };
  } catch (error: any) {
    return { success: false, message: 'Error al buscar vehículo' };
  }
}

/** Buscar cliente por cédula (accesible para admin/gerente en punto de venta) */
export async function searchCustomerByCc(cc: string) {
  try {
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);
    const customer = await prisma.customer.findUnique({
      where: { cc: cc.trim() },
      include: { vehicles: true },
    });
    return { success: true, data: customer };
  } catch (error: any) {
    return { success: false, message: 'Error al buscar cliente' };
  }
}

/** Obtener servicios activos filtrados por categoría (o todos si no se pasa categoría) */
export async function getServicesByCategory(category?: ItemCategory) {
  try {
    await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);
    const services = await prisma.serviceCatalog.findMany({
      where: { isActive: true, ...(category ? { category } : {}) },
      orderBy: { name: 'asc' },
    });
    return {
      success: true,
      data: services.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        basePrice: Number(s.basePrice),
        profitPercentage: s.profitPercentage ? Number(s.profitPercentage) : 0,
        pvp: Math.round(
          (Number(s.basePrice) + (Number(s.basePrice) * (s.profitPercentage ? Number(s.profitPercentage) : 0)) / 100) / 50
        ) * 50,
        aliaddoItemCode: s.aliaddoItemCode,
      })),
    };
  } catch (error: any) {
    return { success: false, message: error.message, data: [] };
  }
}

/**
 * Crea una orden de servicios y la factura DIRECTAMENTE en un solo paso.
 * Para uso exclusivo del Admin/Gerente desde el Punto de Venta.
 * No pasa por estado EN_PISTA — va directo a FACTURADA.
 */
export async function createAndBillServiceOrder(params: {
  plate: string;
  customerName?: string;
  customerCc?: string;
  customerPhone?: string;
  carBrand?: string;
  carModel?: string;
  carColor?: string;
  serviceIds: string[];
  productItems?: { productId: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  emitirFactura: boolean;
}) {
  try {
    const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);
    const {
      plate, customerName, customerCc, customerPhone, carBrand, carModel, carColor,
      serviceIds, productItems, paymentMethod, emitirFactura,
    } = params;

    if ((!serviceIds || serviceIds.length === 0) && (!productItems || productItems.length === 0)) {
      return { success: false, message: 'Selecciona al menos un servicio o producto' };
    }

    // Pre-validar productos si hay alguno
    let products: any[] = [];
    if (productItems && productItems.length > 0) {
      const productIds = productItems.map(p => p.productId);
      products = await prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true }
      });
      
      if (products.length !== productItems.length) {
        return { success: false, message: 'Uno o más productos no son válidos' };
      }

      for (const item of productItems) {
        const p = products.find(p => p.id === item.productId);
        if (p && p.stock < item.quantity) {
          return { success: false, message: `Stock insuficiente para "${p.name}" (disponible: ${p.stock})` };
        }
      }
    }

    const billedOrder = await prisma.$transaction(async (tx) => {
      // 1. Vehículo / Cliente
      let finalPlate = (plate || '').toUpperCase().trim();
      if (!finalPlate) {
        finalPlate = 'GEN-000'; // Vehículo genérico cuando no se especifica placa
      }

      let vehicle = await tx.vehicle.findUnique({
        where: { plate: finalPlate },
        include: { customer: true },
      });

      let customerId = vehicle?.customerId ?? null;

      if (customerName || customerCc || customerPhone) {
        if (!customerId) {
          let existing = customerCc
            ? await tx.customer.findUnique({ where: { cc: customerCc } })
            : null;
          if (existing) {
            customerId = existing.id;
            await tx.customer.update({
              where: { id: customerId },
              data: {
                name: customerName || existing.name,
                phone: customerPhone || existing.phone,
                cc: customerCc || existing.cc,
              },
            });
          } else {
            const newCustomer = await tx.customer.create({
              data: { cc: customerCc || null, name: customerName || null, phone: customerPhone || null },
            });
            customerId = newCustomer.id;
          }
        } else {
          const c = vehicle!.customer!;
          await tx.customer.update({
            where: { id: customerId },
            data: {
              name: customerName || c.name,
              cc: customerCc || c.cc,
              phone: customerPhone || c.phone,
            },
          });
        }
      }

      if (!vehicle) {
        vehicle = await tx.vehicle.create({
          data: {
            plate: finalPlate,
            customerId,
            brand: carBrand || null,
            model: carModel || null,
            color: carColor || null,
          },
          include: { customer: true },
        });
      } else if (carBrand || carModel || carColor || customerId !== vehicle.customerId) {
        vehicle = await tx.vehicle.update({
          where: { id: vehicle.id },
          data: {
            brand: carBrand || vehicle.brand,
            model: carModel || vehicle.model,
            color: carColor || vehicle.color,
            customerId: customerId ?? vehicle.customerId,
          },
          include: { customer: true },
        });
      }

      // 2. Calcular precios de servicios
      let totalServices = 0;
      let orderServicesData: any[] = [];
      let catalogServices: any[] = [];
      
      if (serviceIds && serviceIds.length > 0) {
        catalogServices = await tx.serviceCatalog.findMany({
          where: { id: { in: serviceIds } },
        });

        if (catalogServices.length !== serviceIds.length) throw new Error('Servicios seleccionados no son válidos');

        orderServicesData = catalogServices.map((s) => {
          const base = Number(s.basePrice);
          const pct = s.profitPercentage ? Number(s.profitPercentage) : 0;
          const pvp = Math.round((base + (base * pct) / 100) / 50) * 50;
          totalServices += pvp;
          return { serviceId: s.id, chargedPrice: pvp };
        });
      }

      // Calcular precios de productos
      let totalProducts = 0;
      let orderProductsData: any[] = [];

      if (productItems && productItems.length > 0) {
        orderProductsData = productItems.map((item) => {
          const p = products.find(prod => prod.id === item.productId);
          const unitPrice = Number(p.salePrice);
          const lineTotal = unitPrice * item.quantity;
          totalProducts += lineTotal;
          
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice,
            unitCost: Number(p.unitCost)
          };
        });
      }

      const expectedGrandTotal = totalServices + totalProducts;

      // 3. Crear orden ya FACTURADA
      const order = await tx.order.create({
        data: {
          technicianId: session.userId,
          adminId: session.userId,
          vehicleId: vehicle.id,
          status: 'FACTURADA',
          paymentMethod,
          billedAt: new Date(),
          totalServices,
          totalProducts,
          grandTotal: expectedGrandTotal,
          services: orderServicesData.length > 0 ? { create: orderServicesData } : undefined,
          products: orderProductsData.length > 0 ? { create: orderProductsData } : undefined,
        },
        include: {
          vehicle: { include: { customer: true } },
          technician: { select: { name: true } },
          admin: { select: { name: true } },
          services: { include: { service: true } },
          products: { include: { product: true } },
        },
      });

      // Descontar inventario si hubo productos
      if (orderProductsData.length > 0) {
        for (const op of orderProductsData) {
          const product = products.find(p => p.id === op.productId);
          const newStock = product.stock - op.quantity;

          await tx.product.update({
            where: { id: op.productId },
            data: { stock: newStock }
          });

          await tx.inventoryMovement.create({
            data: {
              productId: op.productId,
              adminId: session.userId,
              type: 'VENTA',
              quantity: -op.quantity,
              previousStock: product.stock,
              newStock: newStock,
              reason: `Venta Directa POS #${order.orderNumber}`
            }
          });
        }
      }

      return { order, catalogServices };
    }, { timeout: 15000 });

    // 4. Aliaddo
    let aliaddoConsecutive: string | null = null;

    if (emitirFactura) {
      try {
        const isCard = paymentMethod === 'TARJETA';
        const isTransfer = paymentMethod === 'TRANSFERENCIA';
        const paymentMeanCode = isCard ? '48' : isTransfer ? '47' : '10';
        const FALLBACK_CODE = 'AGUA';
        const now = new Date();
        const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0];

        const payload: AliaddoInvoicePayload = {
          date: localDate,
          dueDate: localDate,
          paymentFormCode: 'CR',
          paymentMeanCode,
          currencyCode: 'COP',
          personId: '1b117033-c258-4b88-b59c-f137fa3a316d',
          branchId: '8ffca1e5-8f58-11f1-8ea2-42010a26ccd5',
          details: [
            ...billedOrder.order.services.map((s) => ({
              unitValueBeforeTax: Number(s.chargedPrice),
              quantity: 1,
              description: s.service?.name || 'Servicio',
              itemCode: s.service?.aliaddoItemCode || FALLBACK_CODE,
              discountAmount: 0,
              discountIsPercent: true,
            })),
            ...billedOrder.order.products.map((p) => {
              // Si el producto tiene IVA, la DIAN requiere el valor ANTES de impuestos
              // Dado que salePrice ya tiene el IVA incluido, calculamos el base
              const ivaRate = p.product?.iva ? Number(p.product.iva) : 0;
              const unitPrice = Number(p.unitPrice);
              const basePrice = ivaRate > 0 ? unitPrice / (1 + (ivaRate / 100)) : unitPrice;

              return {
                unitValueBeforeTax: Number(basePrice.toFixed(2)),
                quantity: p.quantity,
                description: p.product?.name || 'Producto',
                itemCode: p.product?.barCode || FALLBACK_CODE, // Usa código de barras si existe
                discountAmount: 0,
                discountIsPercent: true,
              };
            })
          ],
        };

        const aliaddoRes = await AliaddoService.createInvoice(payload);
        aliaddoConsecutive = aliaddoRes.consecutive || null;

        await prisma.order.update({
          where: { id: billedOrder.order.id },
          data: {
            aliaddoInvoiceId: aliaddoRes.id,
            cufe: aliaddoRes.cufe || null,
            aliaddoInvoiceStatus: aliaddoRes.stateDian || aliaddoRes.status || 'PROCESADA',
          },
        });

        (billedOrder.order as any).cufe = aliaddoRes.cufe || null;
        (billedOrder.order as any).aliaddoInvoiceStatus = aliaddoRes.stateDian || 'PROCESADA';
        (billedOrder.order as any).aliaddoConsecutive = aliaddoRes.consecutive || null;
      } catch (err: any) {
        console.error('[Aliaddo-ServiceOrder]', err.message);
        (billedOrder.order as any).aliaddoInvoiceStatus = 'ERROR';
        (billedOrder.order as any).aliaddoErrorMessage = err.message;
      }
    } else {
      (billedOrder.order as any).aliaddoInvoiceStatus = 'OMITIDA';
    }

    revalidatePath('/almacen');
    revalidatePath('/caja');
    revalidatePath('/');

    const o = billedOrder.order;
    return {
      success: true,
      aliaddoSuccess: !!(o as any).cufe,
      aliaddoStatus: (o as any).aliaddoInvoiceStatus || null,
      aliaddoError: (o as any).aliaddoErrorMessage || null,
      data: {
        id: o.id,
        orderNumber: o.orderNumber,
        billedAt: o.billedAt,
        paymentMethod: o.paymentMethod,
        grandTotal: Number(o.grandTotal),
        aliaddoConsecutive,
        cufe: (o as any).cufe || null,
        aliaddoInvoiceStatus: (o as any).aliaddoInvoiceStatus || null,
        aliaddoErrorMessage: (o as any).aliaddoErrorMessage || null,
        vehicle: o.vehicle,
        admin: o.admin,
        services: o.services.map((s) => ({
          id: s.id,
          chargedPrice: Number(s.chargedPrice),
          service: { name: s.service?.name || 'Servicio' },
        })),
        products: o.products.map((p) => ({
          id: p.productId,
          quantity: p.quantity,
          unitPrice: Number(p.unitPrice),
          product: { name: p.product?.name || 'Producto', iva: p.product?.iva ? Number(p.product.iva) : null },
        })),
      },
    };
  } catch (error: any) {
    console.error('[createAndBillServiceOrder]', error);
    return { success: false, message: error.message || 'Error al crear la orden' };
  }
}
