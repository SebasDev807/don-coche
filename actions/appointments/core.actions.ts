'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
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
