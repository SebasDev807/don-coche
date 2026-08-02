import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1, "El ID del teléfono de WhatsApp es requerido"),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().min(1, "El ID de la cuenta de WhatsApp Business es requerido"),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1, "El token de acceso de WhatsApp es requerido"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Error validando las variables de entorno:");
  console.error(_env.error.format());
  throw new Error("Faltan variables de entorno requeridas o son inválidas. Verifica tu archivo .env");
}

export const env = _env.data;
