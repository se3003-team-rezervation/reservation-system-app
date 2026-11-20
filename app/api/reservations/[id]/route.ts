import type { NextRequest } from "next/server";
import {
  getDb,
  saveDb,
  withSlotLock,
  isPostgresConfigured,
  pgCancelReservationTx,
  pgCheckInReservationTx,
  pgGetReservationById,
} from "../../../../lib/store.ts";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { status?: "checked-in" | "cancelled" } = {};
  try {
    body = await request.json();
  } catch {
    // If no body provided, defaults to check-in
  }

  const targetStatus = body.status ?? "checked-in";

  // ─── PostgreSQL Transaction Flow ───────────────────────────────────────────
  if (isPostgresConfigured()) {
    if (targetStatus === "cancelled") {
      const result = await pgCancelReservationTx(id);
      if (!result.success) {
        return Response.json({ error: result.error }, { status: result.status });
      }
      return Response.json(result.data);
    }

    const result = await pgCheckInReservationTx(id);
    if (!result.success) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json(result.data);
  }

  // ─── Non-Postgres Fallback Flow ────────────────────────────────────────────
  const normId = id.trim().toUpperCase();
  const db = await getDb();
  const reservation = db.reservations.find((r) => {
    const rId = r.id.toUpperCase();
    return (
      rId === normId ||
      rId === `RES${normId}` ||
      (normId.length === 6 && rId.endsWith(normId))
    );
  });

  if (!reservation) {
    return Response.json({ error: "Reservation not found" }, { status: 404 });
  }

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

  // ─── PostgreSQL Transaction Flow ───────────────────────────────────────────
  if (isPostgresConfigured()) {
    const result = await pgCancelReservationTx(id);
    if (!result.success) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json({
      success: true,
      message: "Reservation cancelled and quota released",
      reservation: result.data,
    });
  }

  // ─── Non-Postgres Fallback Flow ────────────────────────────────────────────
  const normId = id.trim().toUpperCase();
  const db = await getDb();
  const reservation = db.reservations.find((r) => {
    const rId = r.id.toUpperCase();
    return (
      rId === normId ||
      rId === `RES${normId}` ||
      (normId.length === 6 && rId.endsWith(normId))
    );
  });

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

  // ─── PostgreSQL Flow ───────────────────────────────────────────────────────
  if (isPostgresConfigured()) {
    const reservation = await pgGetReservationById(id);
    if (!reservation) {
      return Response.json({ error: "Reservation not found" }, { status: 404 });
    }
    return Response.json(reservation);
  }

  // ─── Non-Postgres Fallback Flow ────────────────────────────────────────────
  const normId = id.trim().toUpperCase();
  const db = await getDb();
  const reservation = db.reservations.find((r) => {
    const rId = r.id.toUpperCase();
    return (
      rId === normId ||
      rId === `RES${normId}` ||
      (normId.length === 6 && rId.endsWith(normId))
    );
  });
  if (!reservation) {
    return Response.json({ error: "Reservation not found" }, { status: 404 });
  }
  return Response.json(reservation);
}
