import { NextRequest } from "next/server";
import { getDb } from "@/lib/store";
import { Meal } from "@/lib/types";

export async function GET(request: NextRequest) {
  const meal = request.nextUrl.searchParams.get("meal") as Meal | null;
  const db = await getDb();
  const filtered = meal ? db.slots.filter((s) => s.meal === meal) : db.slots;
  return Response.json(filtered);
}
