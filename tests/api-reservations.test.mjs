import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Configure isolated store path for test
const testStoreDir = await fs.mkdtemp(path.join(os.tmpdir(), "dormdine-api-test-"));
process.env.DORMDINE_STORAGE = "file";
process.env.DORM_DINE_STORE_PATH = path.join(testStoreDir, "test-dormdine.json");

const { getDb, saveDb, resetDb } = await import("../lib/store.ts");
const { GET: getReservations, POST: createReservation } = await import("../app/api/reservations/route.ts");
const {
  GET: getReservationById,
  PATCH: updateReservation,
  DELETE: deleteReservation,
} = await import("../app/api/reservations/[id]/route.ts");

test("Unit & Integration tests for /api/reservations routes", async (t) => {
  await t.test("GET /api/reservations returns list of reservations", async () => {
    await resetDb();
    const res = await getReservations();
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
  });

  await t.test("POST /api/reservations rejects missing required fields with 400", async () => {
    await resetDb();
    const req = new Request("http://localhost/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentName: "Ali", studentId: "" }),
    });

    const res = await createReservation(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, "Missing required fields");
  });

  await t.test("POST /api/reservations returns 404 when slot does not exist", async () => {
    const req = new Request("http://localhost/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: "John Doe",
        studentId: "S11111",
        slotId: "nonexistent-slot-id",
      }),
    });

    const res = await createReservation(req);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.error, "Slot not found");
  });

  await t.test("POST /api/reservations rejects disabled slot with 400", async () => {
    await resetDb();
    const db = await getDb();
    const slot = db.slots[0];
    slot.disabled = true;
    await saveDb();

    const req = new Request("http://localhost/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: "John Doe",
        studentId: "S22222",
        slotId: slot.id,
      }),
    });

    const res = await createReservation(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, "This slot is currently disabled");
  });

  await t.test("POST /api/reservations rejects overbooking when slot is full with 409", async () => {
    await resetDb();
    const db = await getDb();
    const slot = db.slots.find((s) => s.id === "b3"); // b3 has capacity 30 and booked 30
    assert.ok(slot);
    slot.booked = slot.capacity;
    await saveDb();

    const req = new Request("http://localhost/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: "Full Student",
        studentId: "S33333",
        slotId: slot.id,
      }),
    });

    const res = await createReservation(req);
    assert.equal(res.status, 409);
    const data = await res.json();
    assert.equal(data.error, "Slot is full");
  });

  await t.test("POST /api/reservations creates reservation and increments slot booked count", async () => {
    await resetDb();
    const db = await getDb();
    const slot = db.slots.find((s) => s.id === "l1");
    assert.ok(slot);
    slot.disabled = false;
    const initialBooked = slot.booked;
    await saveDb();

    const req = new Request("http://localhost/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: "Valid Student",
        studentId: "S44444",
        slotId: "l1",
      }),
    });

    const res = await createReservation(req);
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.studentName, "Valid Student");
    assert.equal(data.studentId, "S44444");
    assert.equal(data.status, "active");
    assert.ok(data.id.startsWith("RES"));

    // Check slot booking incremented
    const updatedDb = await getDb();
    const updatedSlot = updatedDb.slots.find((s) => s.id === "l1");
    assert.equal(updatedSlot.booked, initialBooked + 1);
  });

  await t.test("POST /api/reservations rejects duplicate active reservation for same student/meal", async () => {
    const reqDuplicate = new Request("http://localhost/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: "Valid Student",
        studentId: "S44444",
        slotId: "l2", // another lunch slot on same date
      }),
    });

    const res = await createReservation(reqDuplicate);
    assert.equal(res.status, 409);
    const data = await res.json();
    assert.equal(data.error, "You already have a reservation for this meal");
  });

  await t.test("PATCH /api/reservations/[id] checks in student", async () => {
    const db = await getDb();
    const reservation = db.reservations.find((r) => r.studentId === "S44444");
    assert.ok(reservation);

    const req = new Request(`http://localhost/api/reservations/${reservation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "checked-in" }),
    });

    const res = await updateReservation(req, {
      params: Promise.resolve({ id: reservation.id }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "checked-in");

    // Second check-in attempt should return 409
    const secondReq = new Request(`http://localhost/api/reservations/${reservation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "checked-in" }),
    });
    const secondRes = await updateReservation(secondReq, {
      params: Promise.resolve({ id: reservation.id }),
    });
    assert.equal(secondRes.status, 409);
  });

  await t.test("DELETE /api/reservations/[id] cancels reservation and releases quota", async () => {
    await resetDb();
    const db = await getDb();
    const slot = db.slots.find((s) => s.id === "d1");
    slot.booked = 10;
    const testRes = {
      id: "RESTEST99",
      studentName: "Cancel Candidate",
      studentId: "S55555",
      slotId: "d1",
      meal: "dinner",
      startTime: "17:30",
      endTime: "18:00",
      date: new Date().toISOString().split("T")[0],
      status: "active",
      createdAt: new Date().toISOString(),
    };
    db.reservations.push(testRes);
    await saveDb();

    const req = new Request("http://localhost/api/reservations/RESTEST99", {
      method: "DELETE",
    });

    const res = await deleteReservation(req, {
      params: Promise.resolve({ id: "RESTEST99" }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.reservation.status, "cancelled");

    // Verify slot quota was released
    const updatedDb = await getDb();
    const updatedSlot = updatedDb.slots.find((s) => s.id === "d1");
    assert.equal(updatedSlot.booked, 9);
  });

  await t.test("GET /api/reservations/[id] returns reservation or 404", async () => {
    // Existing reservation
    const resFound = await getReservationById(new Request("http://localhost"), {
      params: Promise.resolve({ id: "RES001" }),
    });
    assert.equal(resFound.status, 200);
    const dataFound = await resFound.json();
    assert.equal(dataFound.id, "RES001");

    // Non-existent reservation
    const resNotFound = await getReservationById(new Request("http://localhost"), {
      params: Promise.resolve({ id: "NONEXISTENT999" }),
    });
    assert.equal(resNotFound.status, 404);
  });
});
