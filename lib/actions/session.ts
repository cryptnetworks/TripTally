"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";

export async function requireCurrentUserId() {
  const user = await requireUser();

  if (!user.id) {
    redirect("/login");
  }

  return user.id;
}
