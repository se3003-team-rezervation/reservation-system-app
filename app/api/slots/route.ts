import type { NextRequest } from "next/server";
import {
  getDb,
  saveDb,
  isPostgresConfigured,
  pgGetSlots,
  pgCreateSlot,
} from "../../../lib/store.ts";
import type { Meal, TimeSlot } from "../../../lib/types.ts";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const meal = url.searchParams.get("meal") as Meal | null;
  const includeDisabled = url.searchParams.get("all") === "true";

  if (isPostgresConfigured()) {
    const slots = await pgGetSlots({
      meal: meal ?? undefined,
      includeDisabled,
    });
    return Response.json(slots);
  }

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

    if (isPostgresConfigured()) {
      const created = await pgCreateSlot(newSlot);
      return Response.json(created, { status: 201 });
    }

    const db = await getDb();
    db.slots.push(newSlot);
    await saveDb();

    return Response.json(newSlot, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
