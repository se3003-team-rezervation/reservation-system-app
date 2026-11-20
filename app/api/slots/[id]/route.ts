import { NextRequest } from "next/server";
import { getDb, saveDb, withSlotLock } from "@/lib/store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const slot = db.slots.find((s) => s.id === id);

  if (!slot) {
    return Response.json({ error: "Slot not found" }, { status: 404 });
  }

  try {
    const body = await request.json();

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
