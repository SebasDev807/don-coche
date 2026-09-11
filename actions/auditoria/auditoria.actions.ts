import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/dal';
import { revalidatePath } from 'next/cache';
import { PaymentMethod, OrderStatus } from '@prisma/client';

export async function updateOrderAdmin(
  orderId: string,
  data: {
    status: OrderStatus;
    paymentMethod: PaymentMethod;
  }
) {
  try {
    const session = await verifyRole(['SUPERUSUARIO', 'GERENTE', 'ADMINISTRADOR']);

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return { success: false, message: 'Orden no encontrada' };
    }

    // Si la orden cambia de estado a CANCELADA y antes estaba FACTURADA,
    // DEBERÍAMOS retornar el inventario. Pero para mantenerlo simple y seguro, 
    // advertiremos que la cancelación manual aquí no afecta inventario automáticamente
    // a menos que desarrollemos una lógica inversa robusta.
    // Por ahora, solo actualizamos los campos básicos.

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: data.status,
        paymentMethod: data.paymentMethod,
        adminId: session.userId // Registramos quién hizo el último cambio
      }
    });

    revalidatePath('/auditoria');
    revalidatePath('/caja');
    revalidatePath('/dashboard');

    return { success: true, message: 'Orden actualizada correctamente' };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || 'Error al actualizar orden' };
  }
}
