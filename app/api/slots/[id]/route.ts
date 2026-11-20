import type { NextRequest } from "next/server";
import {
  getDb,
  saveDb,
  withSlotLock,
  isPostgresConfigured,
  pgUpdateSlot,
  pgDeleteSlot,
} from "../../../../lib/store.ts";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();

    if (isPostgresConfigured()) {
      const updated = await pgUpdateSlot(id, body);
      if (!updated) {
        return Response.json({ error: "Slot not found" }, { status: 404 });
      }
      return Response.json(updated);
    }

    const db = await getDb();
    const slot = db.slots.find((s) => s.id === id);

    if (!slot) {
      return Response.json({ error: "Slot not found" }, { status: 404 });
    }

    return await withSlotLock(id, async () => {
      if (typeof body.capacity === "number" && body.capacity > 0) {
        slot.capacity = body.capacity;
      }
      if (typeof body.startTime === "string" && body.startTime.trim()) {
        slot.startTime = body.startTime.trim();
      }
      if (typeof body.endTime === "string" && body.endTime.trim()) {
        slot.endTime = body.endTime.trim();
      }
      if (typeof body.disabled === "boolean") {
        slot.disabled = body.disabled;
      }

      await saveDb();
      return Response.json(slot);
    });
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isPostgresConfigured()) {
    const removed = await pgDeleteSlot(id);
    if (!removed) {
      return Response.json({ error: "Slot not found" }, { status: 404 });
    }
    return Response.json({ success: true, removed });
  }

  const db = await getDb();
  const index = db.slots.findIndex((s) => s.id === id);

  if (index === -1) {
    return Response.json({ error: "Slot not found" }, { status: 404 });
  }

  return await withSlotLock(id, async () => {
    const removed = db.slots.splice(index, 1)[0];
    await saveDb();
    return Response.json({ success: true, removed });
  });
}
