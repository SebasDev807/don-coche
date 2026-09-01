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
    return { success: true, data: vehicle };
  } catch (error) {
    return { success: false, message: 'Error al buscar vehículo' };
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

    const { plate, customerName, customerCc, customerPhone, customerEmail, carBrand, carModel, carColor, services, nextMaintenanceDate, nextMaintenanceReason } = parsed.data;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Buscar vehículo existente por placa
      let vehicle = await tx.vehicle.findUnique({
        where: { plate },
        include: { customer: true },
      });

      let customerId = vehicle?.customerId ?? null;

      // 2. Gestionar Cliente (crear o actualizar siempre con datos nuevos)
      if (customerName || customerPhone || customerEmail || customerCc) {
        if (!customerId) {
          // Sin cliente asociado al vehículo — buscar por CC o crear nuevo
          let existingCustomer = null;
          if (customerCc) {
            existingCustomer = await tx.customer.findUnique({ where: { cc: customerCc } });
          }

          if (existingCustomer) {
            // Cliente encontrado por CC: actualizar con datos que el técnico haya ingresado
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
            // Crear nuevo cliente con todos los datos ingresados
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
          // Ya hay cliente asociado: actualizar sus datos con lo que el técnico ingresó
          // (solo sobreescribe campos que el técnico proporcionó, preserva los vacíos)
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
        // Vehículo nuevo: crear con todos los datos
        vehicle = await tx.vehicle.create({
          data: {
            plate,
            customerId,
            brand: carBrand || null,
            model: carModel || null,
            color: carColor || null,
          },
          include: { customer: true }
        });
      } else {
        // Vehículo existente: actualizar brand/model/color/customerId si se proporcionaron datos nuevos
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
            include: { customer: true }
          });
        }
      }

      // 4. Fetch services to get real prices
      const catalogServices = await tx.serviceCatalog.findMany({
        where: { id: { in: services } },
      });

      if (catalogServices.length === 0) {
        throw new Error('Servicios seleccionados no son válidos');
      }

      let totalServices = 0;
      const orderServicesData = catalogServices.map((s) => {
        const base = Number(s.basePrice);
        const profit = s.profitPercentage ? Number(s.profitPercentage) : 0;
        const price = base + (base * profit / 100);
        
        totalServices += price;
        return {
          serviceId: s.id,
          chargedPrice: price,
        };
      });

      const ivaAmount = totalServices * 0.19;
      const grandTotal = totalServices + ivaAmount;

      // 5. Create Order
      const newOrder = await tx.order.create({
        data: {
          technicianId,
          vehicleId: vehicle.id,
          status: 'EN_PISTA',
          totalServices,
          totalProducts: 0,
          grandTotal: grandTotal,
          services: {
            create: orderServicesData,
          },
          nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
          nextMaintenanceReason: nextMaintenanceReason || null,
        },
        include: {
          vehicle: {
            include: { customer: true }
          }
        }
      });

      return newOrder;
    });

    revalidatePath('/tecnico');
    revalidatePath('/clientes');
    return { 
      success: true, 
      message: 'Orden creada exitosamente', 
      data: {
        ...order,
        totalServices: Number(order.totalServices),
        totalProducts: Number(order.totalProducts),
        grandTotal: Number(order.grandTotal)
      } 
    };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || 'Error al crear la orden' };
  }
}

export async function setNextMaintenance(orderId: string, date: string, reason: string) {
  try {
    const session = await verifySession();
    
    // Ensure order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return { success: false, message: 'Orden no encontrada' };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        nextMaintenanceDate: new Date(date),
        nextMaintenanceReason: reason
      }
    });

    revalidatePath('/tecnico');
    return { success: true, message: 'Recomendación guardada exitosamente' };
  } catch (error: any) {
    console.error('[setNextMaintenance] Error:', error);
    return { success: false, message: 'Error al guardar la recomendación' };
  }
}
