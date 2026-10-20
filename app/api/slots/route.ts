import { NextRequest } from "next/server";
import { slots } from "@/lib/mockStore";
import { Meal } from "@/lib/types";

export async function GET(request: NextRequest) {
  const meal = request.nextUrl.searchParams.get("meal") as Meal | null;
  const filtered = meal ? slots.filter((s) => s.meal === meal) : slots;
  return Response.json(filtered);
}
