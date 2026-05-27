import { z } from "zod";

const optionalBooleanString = z
  .string()
  .optional()
  .transform((value) => value === "true");

export const appConfigSchema = z.object({
  nodeEnv: z.enum(["development", "test", "production"]).default("development"),
  databaseUrl: z
    .string()
    .min(1)
    .refine(
      (value) =>
        value.startsWith("file:") ||
        value.startsWith("postgres://") ||
        value.startsWith("postgresql://"),
      "DATABASE_URL must use file:, postgres://, or postgresql://."
    ),
  nextAuthUrl: z.url(),
  smtpEnabled: optionalBooleanString,
  smtpHost: z.string().optional(),
  smtpFrom: z.string().optional(),
  smtpPort: z.coerce.number().int().positive().max(65535).default(587),
  passwordResetTokenMinutes: z.coerce.number().int().min(30).max(60).default(45)
});

export function getAppConfig() {
  return appConfigSchema.parse({
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    smtpEnabled: process.env.SMTP_ENABLED,
    smtpHost: process.env.SMTP_HOST,
    smtpFrom: process.env.SMTP_FROM,
    smtpPort: process.env.SMTP_PORT,
    passwordResetTokenMinutes: process.env.PASSWORD_RESET_TOKEN_MINUTES
  });
}
