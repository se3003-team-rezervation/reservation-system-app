import test from "node:test";
import assert from "node:assert/strict";

// Configure test environment to connect to local test PostgreSQL database
process.env.DORMDINE_STORAGE = "postgres";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://localhost:5432/dormdine_test";

const {
  getDb,
  resetDb,
  closePgPool,
  getPgPool,
} = await import("../lib/store.ts");

const { POST: createReservation, GET: getReservations } = await import("../app/api/reservations/route.ts");
const {
  GET: getReservationById,
  PATCH: updateReservation,
  DELETE: deleteReservation,
} = await import("../app/api/reservations/[id]/route.ts");
const { GET: getSlots } = await import("../app/api/slots/route.ts");

test("PostgreSQL M3 Integration: Atomic Transactions, Concurrency & Persistence", async (t) => {
  await t.test("initializes PostgreSQL schema and seeds tables", async () => {
    await resetDb();
    const db = await getDb();
    assert.ok(db.slots.length >= 12, "Should seed default slots in PostgreSQL");
    assert.ok(db.reservations.length >= 1, "Should seed default reservations in PostgreSQL");

    const pool = getPgPool();
    const res = await pool.query("SELECT COUNT(*)::int AS count FROM time_slots");
    assert.ok(res.rows[0].count >= 12);
  });

  await t.test(
    "25 concurrent reservation requests for 1 remaining spot: exactly 1 accepted, 24 rejected, capacity never exceeded",
    async () => {
      await resetDb();
      const pool = getPgPool();

      // Setup a dedicated slot with capacity 30 and booked 29 (exactly 1 spot left)
      const testSlotId = "test_slot_c25";
      await pool.query("DELETE FROM reservations WHERE slot_id = $1", [testSlotId]);
      await pool.query("DELETE FROM time_slots WHERE id = $1", [testSlotId]);
      await pool.query(
        `INSERT INTO time_slots (id, meal, start_time, end_time, capacity, booked, disabled)
         VALUES ($1, 'lunch', '12:00', '12:30', 30, 29, FALSE)`,
        [testSlotId]
      );

      // Prepare 25 distinct students
      const students = Array.from({ length: 25 }, (_, i) => ({
        studentName: `Concurrent Student ${i + 1}`,
        studentId: `STU_CONCUR_${String(i + 1).padStart(3, "0")}`,
        slotId: testSlotId,
      }));

      // Fire all 25 requests simultaneously
      const results = await Promise.all(
        students.map(async (student) => {
          const req = new Request("http://localhost/api/reservations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(student),
          });
          const res = await createReservation(req);
          const body = await res.json();
          return { status: res.status, body };
        })
      );

      const accepted = results.filter((r) => r.status === 201);
      const rejected = results.filter((r) => r.status === 409);

      // Assertions on concurrency results
      assert.equal(
        accepted.length,
        1,
        `Expected exactly 1 accepted reservation, but received ${accepted.length}`
      );
      assert.equal(
        rejected.length,
        24,
        `Expected exactly 24 rejected reservations, but received ${rejected.length}`
      );

      // Verify every rejected request got "Slot is full"
      for (const rej of rejected) {
        assert.equal(rej.body.error, "Slot is full");
      }

      // Verify in PostgreSQL database that slot.booked is exactly 30 and NEVER exceeded 30
      const slotQuery = await pool.query(
        "SELECT booked, capacity FROM time_slots WHERE id = $1",
        [testSlotId]
      );
      assert.equal(slotQuery.rows.length, 1);
      const slotRow = slotQuery.rows[0];
      assert.equal(slotRow.booked, 30);
      assert.equal(slotRow.capacity, 30);
      assert.ok(
        slotRow.booked <= slotRow.capacity,
        "Booked must not exceed capacity under any circumstances"
      );

      // Verify only 1 reservation row exists in DB for this test slot
      const resCountQuery = await pool.query(
        "SELECT COUNT(*)::int AS count FROM reservations WHERE slot_id = $1",
        [testSlotId]
      );
      assert.equal(resCountQuery.rows[0].count, 1);
    }
  );

  await t.test("cancellation releases quota in PostgreSQL transaction and allows new booking", async () => {
    const pool = getPgPool();
    const testSlotId = "test_slot_c25";

    // Find the single accepted reservation from the previous test
    const findRes = await pool.query(
      "SELECT id FROM reservations WHERE slot_id = $1 AND status = 'active'",
      [testSlotId]
    );
    assert.equal(findRes.rows.length, 1);
    const reservationId = findRes.rows[0].id;

    // 1. Cancel the reservation
    const deleteReq = new Request(`http://localhost/api/reservations/${reservationId}`, {
      method: "DELETE",
    });
    const deleteRes = await deleteReservation(deleteReq, {
      params: Promise.resolve({ id: reservationId }),
    });
    assert.equal(deleteRes.status, 200);
    const deleteBody = await deleteRes.json();
    assert.equal(deleteBody.success, true);
    assert.equal(deleteBody.reservation.status, "cancelled");

    // 2. Verify quota was freed in PostgreSQL (booked was 30, now 29)
    const slotCheck = await pool.query(
      "SELECT booked FROM time_slots WHERE id = $1",
      [testSlotId]
    );
    assert.equal(slotCheck.rows[0].booked, 29);

    // 3. New student books the released spot
    const newStudentReq = new Request("http://localhost/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: "Reopened Slot Student",
        studentId: "STU_REOPEN_001",
        slotId: testSlotId,
      }),
    });
    const newStudentRes = await createReservation(newStudentReq);
    assert.equal(newStudentRes.status, 201);
    const newStudentBody = await newStudentRes.json();
    assert.equal(newStudentBody.studentName, "Reopened Slot Student");

    // 4. Verify slot is full again (30/30)
    const slotFinal = await pool.query(
      "SELECT booked FROM time_slots WHERE id = $1",
      [testSlotId]
    );
    assert.equal(slotFinal.rows[0].booked, 30);
  });

  await t.test("preserves data and state across simulated application restart", async () => {
    // 1. Simulate server restart: close existing pool and connection state
    await closePgPool();

    // 2. Re-import / call endpoints using a fresh pool
    const listRes = await getReservations();
    assert.equal(listRes.status, 200);
    const reservations = await listRes.json();

    // 3. Verify previous records are still intact in PostgreSQL
    const reopenedStudent = reservations.find((r) => r.studentId === "STU_REOPEN_001");
    assert.ok(reopenedStudent, "Reservation must persist after application restart");
    assert.equal(reopenedStudent.studentName, "Reopened Slot Student");
    assert.equal(reopenedStudent.status, "active");
  });

  await t.test("staff check-in updates status to checked-in via PostgreSQL transaction", async () => {
    const pool = getPgPool();
    const findRes = await pool.query(
      "SELECT id FROM reservations WHERE student_id = 'STU_REOPEN_001'"
    );
    assert.equal(findRes.rows.length, 1);
    const resId = findRes.rows[0].id;

    const patchReq = new Request(`http://localhost/api/reservations/${resId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "checked-in" }),
    });

    const patchRes = await updateReservation(patchReq, {
      params: Promise.resolve({ id: resId }),
    });
    assert.equal(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.equal(patchBody.status, "checked-in");

    // Verify GET by ID on PostgreSQL
    const getRes = await getReservationById(new Request("http://localhost"), {
      params: Promise.resolve({ id: resId }),
    });
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.id, resId);
    assert.equal(getBody.status, "checked-in");

    // Verify in database
    const dbCheck = await pool.query("SELECT status FROM reservations WHERE id = $1", [resId]);
    assert.equal(dbCheck.rows[0].status, "checked-in");
  });

  await t.test("slot overview and occupancy query matches PostgreSQL data", async () => {
    const slotsReq = new Request("http://localhost/api/slots?all=true");
    const slotsRes = await getSlots(slotsReq);
    assert.equal(slotsRes.status, 200);
    const slots = await slotsRes.json();
    assert.ok(Array.isArray(slots));

    const testSlot = slots.find((s) => s.id === "test_slot_c25");
    assert.ok(testSlot);
    assert.equal(testSlot.booked, 30);
    assert.equal(testSlot.capacity, 30);
  });
});
