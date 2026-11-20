import { NextRequest } from "next/server";
import { getDb, saveDb } from "@/lib/store";
import { Meal, TimeSlot } from "@/lib/types";

export async function GET(request: NextRequest) {
  const meal = request.nextUrl.searchParams.get("meal") as Meal | null;
  const includeDisabled = request.nextUrl.searchParams.get("all") === "true";
  const db = await getDb();

  let result = db.slots;
  if (meal) {
    result = result.filter((s) => s.meal === meal);
  }
  if (!includeDisabled) {
    result = result.filter((s) => !s.disabled);
  }

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meal, startTime, endTime, capacity } = body;

    if (!meal || !startTime || !endTime || typeof capacity !== "number" || capacity <= 0) {
      return Response.json(
        { error: "Missing or invalid required fields (meal, startTime, endTime, capacity > 0)" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const id = `${meal[0]}${Date.now().toString(36)}`;
    const newSlot: TimeSlot = {
      id,
      meal,
      startTime,
      endTime,
      capacity,
      booked: 0,
      disabled: false,
    };

    db.slots.push(newSlot);
    await saveDb();

    return Response.json(newSlot, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
