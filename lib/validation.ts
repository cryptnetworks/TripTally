import { z } from "zod";
import { categories } from "@/lib/format";

export const idSchema = z.string().trim().min(1).max(128);

export const dateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), {
    message: "Invalid date."
  });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined);

export const registerSchema = z
  .object({
    username: z.string().trim().min(3).max(80),
    email: z.email().trim().toLowerCase().max(120),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase().max(120),
  password: z.string().min(1).max(128)
});

export const forgotPasswordSchema = z.object({
  email: z.email().trim().toLowerCase().max(120)
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(32).max(256),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
  });

export const tripSchema = z
  .object({
    name: z.string().trim().min(1).max(140),
    destination: optionalText(140),
    startDate: dateStringSchema.optional().or(z.literal("")).transform((value) => value || undefined),
    endDate: dateStringSchema.optional().or(z.literal("")).transform((value) => value || undefined)
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      new Date(`${data.endDate}T00:00:00`) >= new Date(`${data.startDate}T00:00:00`),
    {
      message: "End date must be on or after start date.",
      path: ["endDate"]
    }
  );

export const participantSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().trim().toLowerCase().max(120).optional().or(z.literal("")).transform((value) => value || undefined)
});

export const expenseSchema = z.object({
  title: z.string().trim().min(1).max(140),
  amount: z.coerce.number().positive().max(1_000_000),
  category: z.enum(categories),
  payerId: idSchema,
  date: dateStringSchema,
  notes: optionalText(500),
  sharedParticipantIds: z.array(idSchema).optional().default([])
});

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function parseDateInput(value?: string) {
  return value ? new Date(`${value}T00:00:00`) : null;
}
