'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { createOrderSchema, CreateOrderInput } from '@/validation/orders';
import { revalidatePath } from 'next/cache';

export async function searchByPlate(plate: string) {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { plate: plate.toUpperCase().trim() },
      include: { customer: true },
    });

    // Buscar si hay una orden EN_PISTA activa para este vehículo
    let existingOrder = null;
    if (vehicle) {
      const openOrder = await prisma.order.findFirst({
        where: { vehicleId: vehicle.id, status: 'EN_PISTA' },
        include: {
          technician: { select: { name: true } },
          services: {
            include: {
              service: { select: { name: true } },
            },
          },
          products: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (openOrder) {
        existingOrder = {
          id: openOrder.id,
          orderNumber: openOrder.orderNumber,
          technicianName: openOrder.technician.name,
          totalServices: Number(openOrder.totalServices),
          totalProducts: Number(openOrder.totalProducts),
          grandTotal: Number(openOrder.grandTotal),
          services: openOrder.services.map((s) => ({
            id: s.id,
            name: s.service.name,
            chargedPrice: Number(s.chargedPrice),
            technicianName: s.technicianName || openOrder.technician.name,
          })),
          products: openOrder.products.map((p) => ({
            id: p.id,
            name: p.product.name,
            quantity: p.quantity,
            unitPrice: Number(p.unitPrice),
          })),
        };
      }
    }

    return { success: true, data: vehicle, existingOrder };
  } catch (error) {
    return { success: false, message: 'Error al buscar vehículo', existingOrder: null };
  }
}

export async function createOrder(data: CreateOrderInput) {
  try {
    const session = await verifySession();
    const technicianId = session.userId;

    const parsed = createOrderSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors };
    }

    const {
      plate, customerName, customerCc, customerPhone, customerEmail,
      carBrand, carModel, carColor,
      services, products,
      nextMaintenanceDate, nextMaintenanceReason,
    } = parsed.data;

    // Obtener nombre del técnico para desnormalizar en OrderService
    const technicianUser = await prisma.user.findUnique({
      where: { id: technicianId },
      select: { name: true },
    });
    const technicianName = technicianUser?.name || 'Técnico';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscar vehículo existente por placa
      let vehicle = await tx.vehicle.findUnique({
        where: { plate },
        include: { customer: true },
      });

      let customerId = vehicle?.customerId ?? null;

      // 2. Gestionar Cliente (crear o actualizar siempre con datos nuevos)
      if (customerName || customerPhone || customerEmail || customerCc) {
        if (!customerId) {
          let existingCustomer = null;
          if (customerCc) {
            existingCustomer = await tx.customer.findUnique({ where: { cc: customerCc } });
          }

          if (existingCustomer) {
            customerId = existingCustomer.id;
            await tx.customer.update({
              where: { id: customerId },
              data: {
                name: customerName || existingCustomer.name,
                phone: customerPhone || existingCustomer.phone,
                email: customerEmail || existingCustomer.email,
                cc: customerCc || existingCustomer.cc,
              },
            });
          } else {
            const newCustomer = await tx.customer.create({
              data: {
                cc: customerCc || null,
                name: customerName || null,
                phone: customerPhone || null,
                email: customerEmail || null,
              },
            });
            customerId = newCustomer.id;
          }
        } else {
          const customer = vehicle!.customer!;
          await tx.customer.update({
            where: { id: customerId },
            data: {
              name: customerName || customer.name,
              cc: customerCc || customer.cc,
              phone: customerPhone || customer.phone,
              email: customerEmail || customer.email,
            },
          });
        }
      }

      // 3. Crear o actualizar vehículo
      if (!vehicle) {
        vehicle = await tx.vehicle.create({
          data: {
            plate,
            customerId,
            brand: carBrand || null,
            model: carModel || null,
            color: carColor || null,
          },
          include: { customer: true },
        });
      } else {
        const needsUpdate =
          (carBrand && carBrand !== vehicle.brand) ||
          (carModel && carModel !== vehicle.model) ||
          (carColor && carColor !== vehicle.color) ||
          (customerId && customerId !== vehicle.customerId);

        if (needsUpdate) {
          vehicle = await tx.vehicle.update({
            where: { id: vehicle.id },
            data: {
              customerId: customerId ?? vehicle.customerId,
              brand: carBrand || vehicle.brand,
              model: carModel || vehicle.model,
              color: carColor || vehicle.color,
            },
            include: { customer: true },
          });
        }
      }

      // 4. Buscar si ya existe una orden EN_PISTA para este vehículo
      const existingOpenOrder = await tx.order.findFirst({
        where: { vehicleId: vehicle.id, status: 'EN_PISTA' },
        orderBy: { createdAt: 'desc' },
      });

      // 5. Calcular servicios nuevos a agregar
      const catalogServices = await tx.serviceCatalog.findMany({
        where: { id: { in: services } },
      });

      if (catalogServices.length === 0) {
        throw new Error('Servicios seleccionados no son válidos');
      }

      let newServicesTotal = 0;
      const newOrderServicesData = catalogServices.map((s) => {
        const basePrice = Number(s.basePrice);
        const profitPct = s.profitPercentage ? Number(s.profitPercentage) : 0;
        const pvp = Math.round((basePrice + (basePrice * profitPct / 100)) / 50) * 50;
        newServicesTotal += pvp;
        return {
          serviceId: s.id,
          chargedPrice: pvp,
          technicianId,
          technicianName,
        };
      });

      // 6. Calcular productos nuevos a agregar (si el técnico envió alguno)
      let newProductsTotal = 0;
      const newOrderProductsData: {
        productId: string;
        quantity: number;
        unitPrice: number;
        unitCost: number;
      }[] = [];

      if (products && products.length > 0) {
        const catalogProducts = await tx.product.findMany({
          where: { id: { in: products.map((p) => p.productId) } },
        });

        for (const item of products) {
          const prod = catalogProducts.find((p) => p.id === item.productId);
          if (!prod) throw new Error(`Producto ${item.productId} no encontrado`);
          const unitPrice = Number(prod.salePrice);
          const unitCost = Number(prod.unitCost);
          newProductsTotal += unitPrice * item.quantity;
          newOrderProductsData.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice,
            unitCost,
          });
        }
      }

      // ─────────────────────────────────────────────────────
      // RAMA A: Acumular servicios/productos en orden existente
      // ─────────────────────────────────────────────────────
      if (existingOpenOrder) {
        const prevTotalServices = Number(existingOpenOrder.totalServices);
        const prevTotalProducts = Number(existingOpenOrder.totalProducts);
        const updatedTotalServices = prevTotalServices + newServicesTotal;
        const updatedTotalProducts = prevTotalProducts + newProductsTotal;
        const updatedGrandTotal = updatedTotalServices + updatedTotalProducts;

        // Agregar servicios nuevos a la orden existente
        await tx.orderService.createMany({
          data: newOrderServicesData.map((s) => ({
            ...s,
            orderId: existingOpenOrder.id,
          })),
        });

        // Agregar productos nuevos (si hay)
        if (newOrderProductsData.length > 0) {
          await tx.orderProduct.createMany({
            data: newOrderProductsData.map((p) => ({
              ...p,
              orderId: existingOpenOrder.id,
            })),
          });
        }

        const updatedOrder = await tx.order.update({
          where: { id: existingOpenOrder.id },
          data: {
            totalServices: updatedTotalServices,
            totalProducts: updatedTotalProducts,
            grandTotal: updatedGrandTotal,
            ...(nextMaintenanceDate ? { nextMaintenanceDate: new Date(nextMaintenanceDate) } : {}),
            ...(nextMaintenanceReason ? { nextMaintenanceReason } : {}),
          },
          include: {
            vehicle: { include: { customer: true } },
          },
        });

        return { order: updatedOrder, isAccumulated: true, orderNumber: existingOpenOrder.orderNumber };
      }

      // ─────────────────────────────────────────────────────
      // RAMA B: Crear nueva orden
      // ─────────────────────────────────────────────────────
      const grandTotal = newServicesTotal + newProductsTotal;

      const newOrder = await tx.order.create({
        data: {
          technicianId,
          vehicleId: vehicle.id,
          status: 'EN_PISTA',
          totalServices: newServicesTotal,
          totalProducts: newProductsTotal,
          grandTotal,
          services: {
            create: newOrderServicesData,
          },
          ...(newOrderProductsData.length > 0
            ? { products: { create: newOrderProductsData } }
            : {}),
          nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
          nextMaintenanceReason: nextMaintenanceReason || null,
        },
        include: {
          vehicle: { include: { customer: true } },
        },
      });

      return { order: newOrder, isAccumulated: false, orderNumber: newOrder.orderNumber };
    });

    revalidatePath('/tecnico');
    revalidatePath('/caja');
    revalidatePath('/clientes');

    const { order, isAccumulated, orderNumber } = result;

    return {
      success: true,
      isAccumulated,
      message: isAccumulated
        ? `Servicios agregados a la Orden #${orderNumber} exitosamente`
        : 'Orden creada exitosamente',
      data: {
        ...order,
        totalServices: Number(order.totalServices),
        totalProducts: Number(order.totalProducts),
        grandTotal: Number(order.grandTotal),
      },
    };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || 'Error al crear la orden' };
  }
}

export async function setNextMaintenance(orderId: string, date: string, reason: string) {
  try {
    await verifySession();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, message: 'Orden no encontrada' };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        nextMaintenanceDate: new Date(date),
        nextMaintenanceReason: reason,
      },
    });

    revalidatePath('/tecnico');
    return { success: true, message: 'Recomendación guardada exitosamente' };
  } catch (error: any) {
    console.error('[setNextMaintenance] Error:', error);
    return { success: false, message: 'Error al guardar la recomendación' };
  }
}
