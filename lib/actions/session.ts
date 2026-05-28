"use server";

import { redirect } from "next/navigation";
import { assertSameOriginRequest } from "@/lib/csrf";
import { requireUser } from "@/lib/session";

export async function requireCurrentUserId() {
  await assertSameOriginRequest("user.action");
  const user = await requireUser();

  if (!user.id) {
    redirect("/login");
  }

  return user.id;
}
