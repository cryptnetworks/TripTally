import { z } from "zod";
import { isSafeHttpUrl } from "@/lib/url";

export const paymentProviders = [
  "venmo",
  "paypal",
  "cashapp",
  "apple_cash",
  "zelle",
  "custom"
] as const;
export type PaymentProvider = (typeof paymentProviders)[number];

export const paymentVisibilities = ["trip_members", "private"] as const;

export const paymentMethodSchema = z
  .object({
    provider: z.enum(paymentProviders),
    label: z.string().trim().max(80).optional().or(z.literal("")),
    handle: z.string().trim().max(120).optional().or(z.literal("")),
    url: z.string().trim().max(500).optional().or(z.literal("")),
    visibility: z.enum(paymentVisibilities).default("trip_members"),
    notes: z.string().trim().max(240).optional().or(z.literal("")),
    enabled: z.boolean().default(true)
  })
  .refine((data) => Boolean(data.handle || data.url), {
    message: "Add a handle, email, phone number, or payment link.",
    path: ["handle"]
  })
  .refine((data) => !data.url || isSafeHttpUrl(data.url), {
    message: "Payment links must be safe http(s) URLs.",
    path: ["url"]
  });

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;

export type SettlementPaymentMethod = {
  provider: string;
  label: string | null;
  handle: string | null;
  url: string | null;
  notes: string | null;
};

export function paymentProviderLabel(provider: string) {
  switch (provider) {
    case "venmo":
      return "Venmo";
    case "paypal":
      return "PayPal";
    case "cashapp":
      return "Cash App";
    case "apple_cash":
      return "Apple Cash";
    case "zelle":
      return "Zelle";
    default:
      return "Payment link";
  }
}

export function normalizePaymentMethod(input: PaymentMethodInput) {
  return {
    provider: input.provider,
    label: input.label || null,
    handle: input.handle || null,
    url: input.url || null,
    visibility: input.visibility,
    notes: input.notes || null,
    enabled: input.enabled
  };
}
