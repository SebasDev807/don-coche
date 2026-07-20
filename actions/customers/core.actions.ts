'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { customerSchema, CustomerFormValues } from '@/validation';
import { revalidatePath } from 'next/cache';

export async function getCustomers({ query = '' }: { query?: string } = {}) {
  try {
    await verifySession();

    const customers = await prisma.customer.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        vehicles: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: customers,
    };
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return {
      success: false,
      message: 'Error al obtener la lista de clientes.',
    };
  }
}

export async function createCustomer(data: CustomerFormValues) {
  try {
    await verifySession();

    const validatedData = customerSchema.safeParse(data);
    if (!validatedData.success) {
      return { success: false, message: 'Datos inválidos', errors: validatedData.error.flatten().fieldErrors };
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name: validatedData.data.name,
        phone: validatedData.data.phone || null,
        email: validatedData.data.email || null,
      },
      include: {
        vehicles: true,
      }
    });

    revalidatePath('/clientes');
    return { success: true, message: 'Cliente registrado exitosamente', data: newCustomer };
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return { success: false, message: 'Ocurrió un error al registrar el cliente.' };
  }
}

export async function updateCustomer(id: string, data: Partial<CustomerFormValues>) {
  try {
    await verifySession();

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
      },
    });

    revalidatePath('/clientes');
    return { success: true, message: 'Cliente actualizado', data: customer };
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return { success: false, message: 'Error al actualizar cliente.' };
  }
}
