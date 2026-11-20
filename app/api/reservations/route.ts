import type { NextRequest } from "next/server";
import { generateReservationId } from "../../../lib/mockStore.ts";
import { getDb, saveDb, withSlotLock } from "../../../lib/store.ts";
import type { Reservation } from "../../../lib/types.ts";

export async function GET() {
  const db = await getDb();
  return Response.json(db.reservations);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { studentName, studentId, slotId } = body;

  if (!studentName || !studentId || !slotId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Acquire concurrency lock on slotId to prevent race conditions & overbooking
  return await withSlotLock(slotId, async () => {
    const db = await getDb();
    const slot = db.slots.find((s) => s.id === slotId);
    if (!slot) {
      return Response.json({ error: "Slot not found" }, { status: 404 });
    }
    if (slot.disabled) {
      return Response.json({ error: "This slot is currently disabled" }, { status: 400 });
    }
    if (slot.booked >= slot.capacity) {
      return Response.json({ error: "Slot is full" }, { status: 409 });
    }

    // Check if student already has an active reservation for this meal/date
    const today = new Date().toISOString().split("T")[0];
    const existing = db.reservations.find(
      (r) =>
        r.studentId === studentId &&
        r.meal === slot.meal &&
        r.date === today &&
        r.status === "active"
    );
    if (existing) {
      return Response.json(
        { error: "You already have a reservation for this meal" },
        { status: 409 }
      );
    }

    const newReservation: Reservation = {
      id: generateReservationId(),
      studentName,
      studentId,
      slotId,
      meal: slot.meal,
      startTime: slot.startTime,
      endTime: slot.endTime,
      date: today,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    db.reservations.push(newReservation);
    slot.booked += 1;
    await saveDb();

    return Response.json(newReservation, { status: 201 });
  });
}
