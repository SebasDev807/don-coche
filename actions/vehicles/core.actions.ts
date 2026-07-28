'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { vehicleSchema, VehicleFormValues } from '@/validation';
import { revalidatePath } from 'next/cache';

export async function createVehicle(customerId: string, data: VehicleFormValues) {
  try {
    await verifySession();

    const validatedData = vehicleSchema.safeParse(data);
    if (!validatedData.success) {
      return { success: false, message: 'Datos de vehículo inválidos', errors: validatedData.error.flatten().fieldErrors };
    }

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plate: validatedData.data.plate },
    });

    if (existingVehicle) {
      return { success: false, message: 'Ya existe un vehículo registrado con esta placa.' };
    }

    const newVehicle = await prisma.vehicle.create({
      data: {
        plate: validatedData.data.plate,
        brand: validatedData.data.brand || null,
        model: validatedData.data.model || null,
        color: validatedData.data.color || null,
        customerId,
      },
    });

    revalidatePath('/clientes');
    return { success: true, message: 'Vehículo registrado exitosamente', data: newVehicle };
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    return { success: false, message: 'Ocurrió un error al registrar el vehículo.' };
  }
}

export async function deleteVehicle(id: string, force: boolean = false) {
  try {
    await verifySession();

    if (!force) {
      const ordersCount = await prisma.order.count({
        where: { vehicleId: id },
      });

      if (ordersCount > 0) {
        return { 
          success: false,
          requiresConfirmation: true,
          message: 'Este vehículo tiene órdenes pendientes, ¿seguro que quieres eliminarlo?' 
        };
      }
    }

    // Eliminación en cascada usando transacción para limpiar órdenes y sus detalles
    await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({ where: { vehicleId: id } });
      const orderIds = orders.map(o => o.id);

      if (orderIds.length > 0) {
        await tx.orderService.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.orderProduct.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { vehicleId: id } });
      }

      await tx.vehicle.delete({
        where: { id },
      });
    });

    revalidatePath('/clientes');
    return { success: true, message: 'Vehículo eliminado del sistema.' };
  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
    return { success: false, message: 'Error al eliminar vehículo.' };
  }
}

export async function findOrCreateVehicle(plate: string, customerId?: string) {
  try {
    await verifySession();

    const upperPlate = plate.toUpperCase().trim();
    let vehicle = await prisma.vehicle.findUnique({
      where: { plate: upperPlate },
      include: { customer: true },
    });

    if (!vehicle && customerId) {
      vehicle = await prisma.vehicle.create({
        data: {
          plate: upperPlate,
          customerId,
        },
        include: { customer: true },
      });
    }

    return { success: true, data: vehicle };
  } catch (error: any) {
    console.error('Error finding/creating vehicle:', error);
    return { success: false, message: 'Error buscando vehículo.' };
  }
}
