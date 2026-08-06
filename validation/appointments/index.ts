import { z } from 'zod';

/**
 * Schema de validación para el formulario de agendamiento de citas.
 *
 * Valida que:
 * - Se seleccione un cliente existente (customerId)
 * - Se seleccione un vehículo del cliente (vehicleId)
 * - Se proporcione una fecha/hora programada futura (scheduledAt)
 * - La descripción sea opcional pero si se provee, tenga al menos 3 caracteres
 */
export const appointmentSchema = z.object({
  /** UUID del cliente (opcional si se proveen datos de nuevo cliente) */
  customerId: z.string().optional().or(z.literal('')),
  /** UUID del vehículo (opcional si se proveen datos de nuevo vehículo) */
  vehicleId: z.string().optional().or(z.literal('')),
  
  // Campos de cliente nuevo
  customerCc: z.string().optional().or(z.literal('')),
  customerName: z.string().optional().or(z.literal('')),
  customerPhone: z.string().optional().or(z.literal('')),
  customerEmail: z.string().email('Correo no válido').optional().or(z.literal('')),
  
  // Campos de vehículo nuevo
  carPlate: z.string().optional().or(z.literal('')),
  carBrand: z.string().optional().or(z.literal('')),
  carModel: z.string().optional().or(z.literal('')),
  carColor: z.string().optional().or(z.literal('')),

  /** Fecha y hora programada para la cita (ISO string) */
  scheduledAt: z.string().min(1, 'Debe seleccionar fecha y hora'),
  /** Motivo o descripción de la cita */
  description: z
    .string()
    .min(3, 'La descripción debe tener al menos 3 caracteres')
    .optional()
    .or(z.literal('')),
  /** Notas adicionales */
  notes: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  // Si no hay customerId, exigimos datos de nuevo cliente
  if (!data.customerId) {
    if (!data.customerCc || data.customerCc.length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La cédula es requerida (min 5 chars)", path: ["customerCc"] });
    }
    if (!data.customerName || data.customerName.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El nombre es requerido", path: ["customerName"] });
    }
  }

  // Si no hay vehicleId, exigimos datos de nuevo vehículo
  if (!data.vehicleId) {
    if (!data.carPlate || data.carPlate.length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La placa es requerida", path: ["carPlate"] });
    }
  }
});

/** Tipo inferido del schema para uso con react-hook-form */
export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
