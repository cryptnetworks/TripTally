"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserId } from "@/lib/actions/session";
import { logger } from "@/lib/logger";
import { normalizePaymentMethod, paymentMethodSchema } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { formString, idSchema } from "@/lib/validation";

function parsePaymentForm(formData: FormData) {
  return paymentMethodSchema.safeParse({
    provider: formString(formData, "provider"),
    label: formString(formData, "label"),
    handle: formString(formData, "handle"),
    url: formString(formData, "url"),
    visibility: formString(formData, "visibility") || "trip_members",
    notes: formString(formData, "notes"),
    enabled: formData.get("enabled") !== "off"
  });
}

export async function savePaymentMethod(formData: FormData) {
  const userId = await requireCurrentUserId();
  const paymentMethodId = formString(formData, "paymentMethodId");
  const parsedId = paymentMethodId ? idSchema.safeParse(paymentMethodId) : null;
  const parsed = parsePaymentForm(formData);

  if (!parsed.success || (parsedId && !parsedId.success)) {
    logger.warn("payment_method.save.validation_failed", { userId });
    redirect("/account?payment=invalid");
  }

  const data = normalizePaymentMethod(parsed.data);

  if (parsedId?.success) {
    await prisma.paymentMethod.updateMany({
      where: { id: parsedId.data, userId },
      data
    });
    logger.info("payment_method.update.success", { userId, paymentMethodId: parsedId.data });
  } else {
    await prisma.paymentMethod.create({ data: { ...data, userId } });
    logger.info("payment_method.create.success", { userId });
  }

  revalidatePath("/account");
  redirect("/account?payment=updated");
}

export async function deletePaymentMethod(formData: FormData) {
  const userId = await requireCurrentUserId();
  const parsedId = idSchema.safeParse(formString(formData, "paymentMethodId"));
  if (!parsedId.success) redirect("/account?payment=invalid");

  await prisma.paymentMethod.deleteMany({ where: { id: parsedId.data, userId } });
  logger.info("payment_method.delete.success", { userId, paymentMethodId: parsedId.data });
  revalidatePath("/account");
  redirect("/account?payment=deleted");
}
