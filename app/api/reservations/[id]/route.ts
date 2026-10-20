import { NextRequest } from "next/server";
import { reservations } from "@/lib/mockStore";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reservation = reservations.find((r) => r.id === id);

  if (!reservation) {
    return Response.json({ error: "Reservation not found" }, { status: 404 });
  }

  if (reservation.status === "checked-in") {
    return Response.json({ error: "Already checked in" }, { status: 409 });
  }

  if (reservation.status === "cancelled") {
    return Response.json({ error: "Reservation is cancelled" }, { status: 409 });
  }

  reservation.status = "checked-in";
  return Response.json(reservation);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reservation = reservations.find((r) => r.id === id);
  if (!reservation) {
    return Response.json({ error: "Reservation not found" }, { status: 404 });
  }
  return Response.json(reservation);
}
