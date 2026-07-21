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

    const { plate, customerName, customerPhone, customerEmail, carBrand, carModel, carColor, services } = parsed.data;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Find existing vehicle
      let vehicle = await tx.vehicle.findUnique({
        where: { plate },
        include: { customer: true },
      });

      let customerId = vehicle?.customerId;

      // 2. Manage Customer
      if (customerName || customerPhone || customerEmail) {
        if (!customerId) {
          // Create new customer if details provided and no customer exists
          const newCustomer = await tx.customer.create({
            data: {
              name: customerName,
              phone: customerPhone,
              email: customerEmail || null,
            },
          });
          customerId = newCustomer.id;
        } else {
          // Optionally update existing customer info if empty
          const customer = vehicle!.customer!;
          if (!customer.name && customerName) {
            await tx.customer.update({
              where: { id: customerId },
              data: { name: customerName, phone: customerPhone || customer.phone },
            });
          }
        }
      }

      // 3. Create or update vehicle
      if (!vehicle) {
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
      } else if (!vehicle.customerId && customerId) {
        vehicle = await tx.vehicle.update({
          where: { id: vehicle.id },
          data: { 
            customerId: customerId || vehicle.customerId,
            brand: carBrand || vehicle.brand,
            model: carModel || vehicle.model,
            color: carColor || vehicle.color,
          },
          include: { customer: true }
        });
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
        const price = Number(s.basePrice);
        totalServices += price;
        return {
          serviceId: s.id,
          chargedPrice: price,
        };
      });

      // 5. Create Order
      const newOrder = await tx.order.create({
        data: {
          technicianId,
          vehicleId: vehicle.id,
          status: 'EN_PISTA',
          totalServices,
          totalProducts: 0,
          grandTotal: totalServices,
          services: {
            create: orderServicesData,
          },
        },
      });

      return newOrder;
    });

    revalidatePath('/tecnico');
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
