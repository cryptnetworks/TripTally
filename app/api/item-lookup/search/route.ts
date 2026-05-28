import { NextResponse } from "next/server";
import { searchItems } from "@/lib/item-lookup/service";
import { requireUser } from "@/lib/session";

export async function GET(request: Request) {
  await requireUser();
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const results = await searchItems(query);
  return NextResponse.json({ results });
}
