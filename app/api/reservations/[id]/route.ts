import { NextRequest } from "next/server";
import { getDb, saveDb, withSlotLock } from "@/lib/store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const reservation = db.reservations.find((r) => r.id === id);

  if (!reservation) {
    return Response.json({ error: "Reservation not found" }, { status: 404 });
  }

  let body: { status?: "checked-in" | "cancelled" } = {};
  try {
    body = await request.json();
  } catch {
    // If no body provided, defaults to check-in
  }

  const targetStatus = body.status ?? "checked-in";

  if (targetStatus === "cancelled") {
    if (reservation.status === "cancelled") {
      return Response.json({ error: "Reservation is already cancelled" }, { status: 409 });
    }

    return await withSlotLock(reservation.slotId, async () => {
      if (reservation.status === "active") {
        const slot = db.slots.find((s) => s.id === reservation.slotId);
        if (slot && slot.booked > 0) {
          slot.booked -= 1;
        }
      }
      reservation.status = "cancelled";
      await saveDb();
      return Response.json(reservation);
    });
  }

  if (reservation.status === "checked-in") {
    return Response.json({ error: "Already checked in" }, { status: 409 });
  }

  if (reservation.status === "cancelled") {
    return Response.json({ error: "Reservation is cancelled" }, { status: 409 });
  }

  reservation.status = "checked-in";
  await saveDb();
  return Response.json(reservation);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const reservation = db.reservations.find((r) => r.id === id);

  if (!reservation) {
    return Response.json({ error: "Reservation not found" }, { status: 404 });
  }

  if (reservation.status === "cancelled") {
    return Response.json({ error: "Reservation is already cancelled" }, { status: 409 });
  }

  return await withSlotLock(reservation.slotId, async () => {
    // Automatic quota release: decrement slot booking if reservation was active
    if (reservation.status === "active") {
      const slot = db.slots.find((s) => s.id === reservation.slotId);
      if (slot && slot.booked > 0) {
        slot.booked -= 1;
      }
    }

    reservation.status = "cancelled";
    await saveDb();

    return Response.json({
      success: true,
      message: "Reservation cancelled and quota released",
      reservation,
    });
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const reservation = db.reservations.find((r) => r.id === id);
  if (!reservation) {
    return Response.json({ error: "Reservation not found" }, { status: 404 });
  }
  return Response.json(reservation);
}
