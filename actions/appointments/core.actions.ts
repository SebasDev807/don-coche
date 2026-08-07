'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { revalidatePath } from 'next/cache';
import { appointmentSchema, type AppointmentFormValues } from '@/validation';
import { BUSINESS_HOURS } from '@/constants/business';
import type { AppointmentStatus } from '@prisma/client';

// -----------------------------------------------------------------------
// TIPOS Y DTOs
// -----------------------------------------------------------------------

/**
 * DTO serializable de una cita para el transporte entre server y client components.
 * Incluye datos aplanados de las relaciones (cliente, vehículo, creador).
 */
export interface AppointmentDTO {
  id: string;
  scheduledAt: Date;
  status: AppointmentStatus;
  description: string | null;
  notes: string | null;
  createdAt: Date;
  /** Nombre del cliente asociado a la cita */
  customerName: string | null;
  /** Cédula del cliente */
  customerCc: string | null;
  /** Teléfono del cliente */
  customerPhone: string | null;
  /** Placa del vehículo */
  vehiclePlate: string;
  /** Marca del vehículo */
  vehicleBrand: string | null;
  /** Modelo del vehículo */
  vehicleModel: string | null;
  /** Nombre de quien agendó la cita (null si fue por WhatsApp) */
  createdByName: string | null;
}

/**
 * Contadores resumen para las tarjetas KPI de citas.
 */
export interface AppointmentKPIData {
  /** Citas pendientes totales */
  totalPending: number;
  /** Citas agendadas para hoy */
  todayCount: number;
  /** Citas cumplidas en los últimos 7 días */
  completedLast7Days: number;
  /** Citas perdidas en los últimos 7 días */
  missedLast7Days: number;
}

/**
 * Filtros disponibles para consultar citas.
 */
export interface AppointmentFilters {
  /** Filtrar por estado de la cita */
  status?: AppointmentStatus;
  /** Búsqueda por nombre de cliente o placa de vehículo */
  query?: string;
}

// -----------------------------------------------------------------------
// ACCIONES
// -----------------------------------------------------------------------

/**
 * Obtiene la lista de citas con filtros opcionales.
 *
 * Por defecto, retorna solo citas con estado PENDIENTE ordenadas por
 * `scheduledAt ASC` (la más próxima primero).
 *
 * @param filters - Filtros opcionales de estado y búsqueda de texto.
 * @returns Objeto con éxito y data (array de {@link AppointmentDTO}).
 */
export async function getAppointments(filters: AppointmentFilters = {}) {
  try {
    await verifySession();

    const { status, query } = filters;

    const whereClause: any = {};

    // Filtro por estado
    if (status) {
      whereClause.status = status;
    }

    // Filtro de búsqueda por texto (nombre de cliente o placa)
    if (query && query.trim().length > 0) {
      whereClause.OR = [
        { customer: { name: { contains: query, mode: 'insensitive' } } },
        { customer: { cc: { contains: query, mode: 'insensitive' } } },
        { vehicle: { plate: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { name: true, cc: true, phone: true },
        },
        vehicle: {
          select: { plate: true, brand: true, model: true },
        },
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Mapear a DTO serializable
    const data: AppointmentDTO[] = appointments.map((apt) => ({
      id: apt.id,
      scheduledAt: apt.scheduledAt,
      status: apt.status,
      description: apt.description,
      notes: apt.notes,
      createdAt: apt.createdAt,
      customerName: apt.customer.name,
      customerCc: apt.customer.cc,
      customerPhone: apt.customer.phone,
      vehiclePlate: apt.vehicle.plate,
      vehicleBrand: apt.vehicle.brand,
      vehicleModel: apt.vehicle.model,
      createdByName: apt.createdBy?.name ?? null,
    }));

    return { success: true as const, data };
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return {
      success: false as const,
      data: [] as AppointmentDTO[],
      message: 'Error al obtener las citas.',
    };
  }
}

/**
 * Obtiene los datos agregados para las tarjetas KPI de la vista de citas.
 *
 * Calcula:
 * - Total de citas pendientes
 * - Citas de hoy
 * - Citas cumplidas en los últimos 7 días
 * - Citas perdidas en los últimos 7 días
 *
 * @returns Objeto con éxito y data ({@link AppointmentKPIData}).
 */
export async function getAppointmentKPIs(): Promise<{
  success: boolean;
  data: AppointmentKPIData;
}> {
  try {
    await verifySession();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalPending, todayCount, completedLast7Days, missedLast7Days] =
      await Promise.all([
        prisma.appointment.count({
          where: { status: 'PENDIENTE' },
        }),
        prisma.appointment.count({
          where: {
            scheduledAt: { gte: startOfToday, lt: endOfToday },
          },
        }),
        prisma.appointment.count({
          where: {
            status: 'CUMPLIDA',
            updatedAt: { gte: sevenDaysAgo },
          },
        }),
        prisma.appointment.count({
          where: {
            status: 'PERDIDA',
            updatedAt: { gte: sevenDaysAgo },
          },
        }),
      ]);

    return {
      success: true,
      data: { totalPending, todayCount, completedLast7Days, missedLast7Days },
    };
  } catch (error: any) {
    console.error('Error fetching appointment KPIs:', error);
    return {
      success: false,
      data: { totalPending: 0, todayCount: 0, completedLast7Days: 0, missedLast7Days: 0 },
    };
  }
}

/**
 * Crea una nueva cita validando los datos con Zod.
 *
 * Verifica que:
 * 1. Los datos del formulario son válidos
 * 2. La fecha no cae en un día cerrado (domingo)
 * 3. La hora está dentro del horario laboral
 * 4. El slot no está ya ocupado por otra cita pendiente
 *
 * @param data - Datos del formulario de agendamiento.
 * @returns Resultado con éxito/error y mensaje descriptivo.
 */
export async function createAppointment(data: AppointmentFormValues) {
  try {
    const session = await verifySession();

    // 1. Validar datos con Zod
    const parsed = appointmentSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { 
      customerId, vehicleId, scheduledAt, description, notes,
      customerCc, customerName, customerPhone, customerEmail,
      carPlate, carBrand, carModel, carColor 
    } = parsed.data;
    const scheduledDate = new Date(scheduledAt);

    // 2. Validar que no sea un día cerrado
    if (BUSINESS_HOURS.closedDays.includes(scheduledDate.getDay())) {
      return {
        success: false,
        message: 'No se pueden agendar citas en días no laborales (Domingos).',
      };
    }

    // 3. Validar que la hora esté dentro del horario laboral
    const hour = scheduledDate.getHours();
    if (hour < BUSINESS_HOURS.openHour || hour >= BUSINESS_HOURS.closeHour) {
      return {
        success: false,
        message: `La hora debe estar entre las ${BUSINESS_HOURS.openHour}:00 y las ${BUSINESS_HOURS.closeHour}:00.`,
      };
    }

    // 4. Verificar que el slot no esté ocupado
    const slotStart = new Date(scheduledDate);
    const slotEnd = new Date(
      scheduledDate.getTime() + BUSINESS_HOURS.slotDurationMinutes * 60 * 1000
    );

    const conflicting = await prisma.appointment.findFirst({
      where: {
        status: 'PENDIENTE',
        scheduledAt: {
          gte: slotStart,
          lt: slotEnd,
        },
      },
    });

    if (conflicting) {
      return {
        success: false,
        message: 'Ya existe una cita agendada en ese horario. Seleccione otra hora.',
      };
    }

    // 5. Crear cliente y/o vehículo si es necesario
    let finalCustomerId = customerId;
    let finalVehicleId = vehicleId;

    if (!finalCustomerId) {
      let existingCustomer = null;
      if (customerCc) {
        existingCustomer = await prisma.customer.findUnique({ where: { cc: customerCc } });
      }

      if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
        if ((!existingCustomer.name && customerName) || (!existingCustomer.phone && customerPhone)) {
          await prisma.customer.update({
            where: { id: finalCustomerId },
            data: {
              name: customerName || existingCustomer.name,
              phone: customerPhone || existingCustomer.phone,
              email: customerEmail || existingCustomer.email,
            },
          });
        }
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            cc: customerCc || null,
            name: customerName!,
            phone: customerPhone || null,
            email: customerEmail || null,
          }
        });
        finalCustomerId = newCustomer.id;
      }
    }

    if (!finalVehicleId) {
      const newVehicle = await prisma.vehicle.create({
        data: {
          plate: carPlate!.toUpperCase(),
          brand: carBrand || null,
          model: carModel || null,
          color: carColor || null,
          customerId: finalCustomerId,
        }
      });
      finalVehicleId = newVehicle.id;
    }

    // 6. Crear la cita
    await prisma.appointment.create({
      data: {
        customerId: finalCustomerId,
        vehicleId: finalVehicleId,
        createdById: session.userId,
        scheduledAt: scheduledDate,
        description: description || null,
        notes: notes || null,
      },
    });

    revalidatePath('/citas');
    return { success: true, message: 'Cita agendada exitosamente.' };
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return { success: false, message: 'Ocurrió un error al agendar la cita.' };
  }
}

/**
 * Obtiene las horas ya ocupadas para una fecha específica.
 *
 * Consulta todas las citas con estado PENDIENTE en el día dado y retorna
 * un array de horas (formato 24h) que ya están asignadas. El componente
 * de selección de hora usa esto para deshabilitar los slots ocupados.
 *
 * @param dateStr - Fecha en formato ISO (YYYY-MM-DD).
 * @returns Objeto con éxito y array de horas ocupadas (ej: [8, 10, 14]).
 */
export async function getBookedSlots(dateStr: string): Promise<{
  success: boolean;
  data: number[];
}> {
  try {
    await verifySession();

    const date = new Date(dateStr + 'T00:00:00');
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'PENDIENTE',
        scheduledAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      select: { scheduledAt: true },
    });

    const bookedHours = appointments.map((apt) => new Date(apt.scheduledAt).getHours());

    return { success: true, data: bookedHours };
  } catch (error: any) {
    console.error('Error fetching booked slots:', error);
    return { success: false, data: [] };
  }
}
