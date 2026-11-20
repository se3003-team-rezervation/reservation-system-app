import pg from "pg";
import type { TimeSlot, Reservation, Meal } from "../types.ts";
import { createSeedSlots, createSeedReservations, generateReservationId } from "../mockStore.ts";

const { Pool } = pg;

type GlobalWithPg = typeof globalThis & {
  __dormDinePgPool?: pg.Pool;
  __dormDinePgInitPromise?: Promise<void>;
};

const g = globalThis as GlobalWithPg;

export function isPostgresConfigured(): boolean {
  if (process.env.DORMDINE_STORAGE === "memory" || process.env.DORMDINE_STORAGE === "file") {
    return false;
  }
  return (
    process.env.DORMDINE_STORAGE === "postgres" ||
    Boolean(process.env.DATABASE_URL) ||
    Boolean(process.env.POSTGRES_URL)
  );
}

export function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    "postgresql://localhost:5432/dormdine"
  );
}

export function getPgPool(): pg.Pool {
  if (!g.__dormDinePgPool) {
    const connectionString = getDatabaseUrl();
    g.__dormDinePgPool = new Pool({
      connectionString,
      max: 30, // Support 25+ concurrent requests
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });

    // Handle idle client errors
    g.__dormDinePgPool.on("error", (err) => {
      console.error("[PostgreSQL Pool Error]:", err);
    });
  }
  return g.__dormDinePgPool;
}

export async function closePgPool(): Promise<void> {
  if (g.__dormDinePgPool) {
    await g.__dormDinePgPool.end();
    g.__dormDinePgPool = undefined;
    g.__dormDinePgInitPromise = undefined;
  }
}

interface SlotRow {
  id: string;
  meal: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked: number;
  disabled: boolean;
}

interface ReservationRow {
  id: string;
  student_name: string;
  student_id: string;
  slot_id: string;
  meal: string;
  start_time: string;
  end_time: string;
  date: string;
  status: "active" | "checked-in" | "cancelled";
  created_at: Date | string;
}

function mapRowToSlot(row: SlotRow): TimeSlot {
  return {
    id: row.id,
    meal: row.meal as Meal,
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: Number(row.capacity),
    booked: Number(row.booked),
    disabled: Boolean(row.disabled),
  };
}

function mapRowToReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    studentName: row.student_name,
    studentId: row.student_id,
    slotId: row.slot_id,
    meal: row.meal as Meal,
    startTime: row.start_time,
    endTime: row.end_time,
    date: row.date,
    status: row.status,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function initPostgresSchema(): Promise<void> {
  if (g.__dormDinePgInitPromise) {
    return g.__dormDinePgInitPromise;
  }

  g.__dormDinePgInitPromise = (async () => {
    const pool = getPgPool();

    // 1. Create tables and indexes if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id VARCHAR(32) PRIMARY KEY,
        meal VARCHAR(16) NOT NULL,
        start_time VARCHAR(8) NOT NULL,
        end_time VARCHAR(8) NOT NULL,
        capacity INTEGER NOT NULL CHECK (capacity > 0),
        booked INTEGER NOT NULL DEFAULT 0 CHECK (booked >= 0 AND booked <= capacity),
        disabled BOOLEAN NOT NULL DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS reservations (
        id VARCHAR(32) PRIMARY KEY,
        student_name VARCHAR(128) NOT NULL,
        student_id VARCHAR(32) NOT NULL,
        slot_id VARCHAR(32) NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
        meal VARCHAR(16) NOT NULL,
        start_time VARCHAR(8) NOT NULL,
        end_time VARCHAR(8) NOT NULL,
        date VARCHAR(16) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checked-in', 'cancelled')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_student_meal_date
      ON reservations (student_id, meal, date)
      WHERE status = 'active';

      CREATE INDEX IF NOT EXISTS idx_reservations_slot_id ON reservations (slot_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations (status);
      CREATE INDEX IF NOT EXISTS idx_time_slots_meal ON time_slots (meal);
    `);

    // 2. Check if slots table is empty; if so, populate with seed data
    const slotCountRes = await pool.query("SELECT COUNT(*)::int AS count FROM time_slots");
    if (slotCountRes.rows[0].count === 0) {
      const seedSlots = createSeedSlots();
      for (const s of seedSlots) {
        await pool.query(
          `INSERT INTO time_slots (id, meal, start_time, end_time, capacity, booked, disabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [s.id, s.meal, s.startTime, s.endTime, s.capacity, s.booked, Boolean(s.disabled)]
        );
      }

      const seedReservations = createSeedReservations();
      for (const r of seedReservations) {
        await pool.query(
          `INSERT INTO reservations (id, student_name, student_id, slot_id, meal, start_time, end_time, date, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [
            r.id,
            r.studentName,
            r.studentId,
            r.slotId,
            r.meal,
            r.startTime,
            r.endTime,
            r.date,
            r.status,
            r.createdAt,
          ]
        );
      }
    }
  })();

  return g.__dormDinePgInitPromise;
}

export async function pgResetDb(customSlots?: TimeSlot[], customReservations?: Reservation[]): Promise<void> {
  await initPostgresSchema();
  const pool = getPgPool();
  await pool.query("TRUNCATE TABLE reservations, time_slots RESTART IDENTITY CASCADE");

  const slots = customSlots ?? createSeedSlots();
  for (const s of slots) {
    await pool.query(
      `INSERT INTO time_slots (id, meal, start_time, end_time, capacity, booked, disabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s.id, s.meal, s.startTime, s.endTime, s.capacity, s.booked, Boolean(s.disabled)]
    );
  }

  const reservations = customReservations ?? createSeedReservations();
  for (const r of reservations) {
    await pool.query(
      `INSERT INTO reservations (id, student_name, student_id, slot_id, meal, start_time, end_time, date, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        r.id,
        r.studentName,
        r.studentId,
        r.slotId,
        r.meal,
        r.startTime,
        r.endTime,
        r.date,
        r.status,
        r.createdAt,
      ]
    );
  }
}

// ─── Query Operations ────────────────────────────────────────────────────────

export async function pgGetSlots(filter?: { meal?: Meal; includeDisabled?: boolean }): Promise<TimeSlot[]> {
  await initPostgresSchema();
  const pool = getPgPool();
  let query = "SELECT * FROM time_slots WHERE 1=1";
  const params: unknown[] = [];

  if (filter?.meal) {
    params.push(filter.meal);
    query += ` AND meal = $${params.length}`;
  }
  if (!filter?.includeDisabled) {
    query += " AND disabled = FALSE";
  }

  query += " ORDER BY id ASC";
  const res = await pool.query<SlotRow>(query, params);
  return res.rows.map(mapRowToSlot);
}

export async function pgGetSlotById(id: string): Promise<TimeSlot | null> {
  await initPostgresSchema();
  const pool = getPgPool();
  const res = await pool.query<SlotRow>("SELECT * FROM time_slots WHERE id = $1", [id]);
  if (res.rows.length === 0) return null;
  return mapRowToSlot(res.rows[0]);
}

export async function pgCreateSlot(slot: TimeSlot): Promise<TimeSlot> {
  await initPostgresSchema();
  const pool = getPgPool();
  const res = await pool.query<SlotRow>(
    `INSERT INTO time_slots (id, meal, start_time, end_time, capacity, booked, disabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [slot.id, slot.meal, slot.startTime, slot.endTime, slot.capacity, slot.booked, Boolean(slot.disabled)]
  );
  return mapRowToSlot(res.rows[0]);
}

export async function pgUpdateSlot(id: string, updates: Partial<TimeSlot>): Promise<TimeSlot | null> {
  await initPostgresSchema();
  const pool = getPgPool();
  const existing = await pgGetSlotById(id);
  if (!existing) return null;

  const capacity = updates.capacity ?? existing.capacity;
  const startTime = updates.startTime ?? existing.startTime;
  const endTime = updates.endTime ?? existing.endTime;
  const disabled = updates.disabled !== undefined ? updates.disabled : existing.disabled;

  const res = await pool.query<SlotRow>(
    `UPDATE time_slots
     SET capacity = $1, start_time = $2, end_time = $3, disabled = $4
     WHERE id = $5
     RETURNING *`,
    [capacity, startTime, endTime, disabled, id]
  );
  if (res.rows.length === 0) return null;
  return mapRowToSlot(res.rows[0]);
}

export async function pgDeleteSlot(id: string): Promise<TimeSlot | null> {
  await initPostgresSchema();
  const pool = getPgPool();
  const res = await pool.query<SlotRow>("DELETE FROM time_slots WHERE id = $1 RETURNING *", [id]);
  if (res.rows.length === 0) return null;
  return mapRowToSlot(res.rows[0]);
}

export async function pgGetReservations(): Promise<Reservation[]> {
  await initPostgresSchema();
  const pool = getPgPool();
  const res = await pool.query<ReservationRow>("SELECT * FROM reservations ORDER BY created_at DESC");
  return res.rows.map(mapRowToReservation);
}

export async function pgGetReservationById(id: string): Promise<Reservation | null> {
  await initPostgresSchema();
  const pool = getPgPool();
  const normId = id.trim().toUpperCase();
  const res = await pool.query<ReservationRow>(
    `SELECT * FROM reservations
     WHERE UPPER(id) = $1
        OR UPPER(id) = $2
        OR (LENGTH($1) = 6 AND UPPER(id) LIKE '%' || $1)
     LIMIT 1`,
    [normId, `RES${normId}`]
  );
  if (res.rows.length === 0) return null;
  return mapRowToReservation(res.rows[0]);
}

// ─── Atomic PostgreSQL Transactions (Capacity & Quota Control) ──────────────

export type TxResult<T> =
  | { success: true; data: T; status: number }
  | { success: false; error: string; status: number };

/**
 * Creates a reservation inside an atomic PostgreSQL TRANSACTION with row-level locking (FOR UPDATE).
 * Guarantees that even under high concurrency (e.g. 25+ simultaneous requests):
 * - Exactly available spots are booked.
 * - Overbooking beyond capacity is strictly impossible.
 * - Duplicate active reservations for the same student/meal/date are rejected.
 */
export async function pgCreateReservationTx(params: {
  studentName: string;
  studentId: string;
  slotId: string;
}): Promise<TxResult<Reservation>> {
  await initPostgresSchema();
  const pool = getPgPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Lock the target time_slot row exclusively
    const slotRes = await client.query<SlotRow>(
      "SELECT * FROM time_slots WHERE id = $1 FOR UPDATE",
      [params.slotId]
    );

    if (slotRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Slot not found", status: 404 };
    }

    const slot = mapRowToSlot(slotRes.rows[0]);

    if (slot.disabled) {
      await client.query("ROLLBACK");
      return { success: false, error: "This slot is currently disabled", status: 400 };
    }

    if (slot.booked >= slot.capacity) {
      await client.query("ROLLBACK");
      return { success: false, error: "Slot is full", status: 409 };
    }

    // 2. Check if student already has an active reservation for this meal on the same day
    const today = new Date().toISOString().split("T")[0];
    const existingRes = await client.query(
      `SELECT id FROM reservations
       WHERE student_id = $1 AND meal = $2 AND date = $3 AND status = 'active'
       FOR UPDATE`,
      [params.studentId, slot.meal, today]
    );

    if (existingRes.rows.length > 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "You already have a reservation for this meal", status: 409 };
    }

    // 3. Generate reservation ID and insert record
    const newReservation: Reservation = {
      id: generateReservationId(),
      studentName: params.studentName,
      studentId: params.studentId,
      slotId: slot.id,
      meal: slot.meal,
      startTime: slot.startTime,
      endTime: slot.endTime,
      date: today,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    await client.query(
      `INSERT INTO reservations (id, student_name, student_id, slot_id, meal, start_time, end_time, date, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        newReservation.id,
        newReservation.studentName,
        newReservation.studentId,
        newReservation.slotId,
        newReservation.meal,
        newReservation.startTime,
        newReservation.endTime,
        newReservation.date,
        newReservation.status,
        newReservation.createdAt,
      ]
    );

    // 4. Atomically increment slot booked counter
    await client.query(
      "UPDATE time_slots SET booked = booked + 1 WHERE id = $1",
      [slot.id]
    );

    await client.query("COMMIT");
    return { success: true, data: newReservation, status: 201 };
  } catch (err) {
    await client.query("ROLLBACK");
    // Handle unique constraint violation gracefully if caught by DB index
    if ((err as { code?: string }).code === "23505") {
      return { success: false, error: "You already have a reservation for this meal", status: 409 };
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Cancels a reservation inside an atomic PostgreSQL TRANSACTION with quota release.
 * Re-opens the capacity spot immediately for other students.
 */
export async function pgCancelReservationTx(id: string): Promise<TxResult<Reservation>> {
  await initPostgresSchema();
  const pool = getPgPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const normId = id.trim().toUpperCase();
    const resQuery = await client.query<ReservationRow>(
      `SELECT * FROM reservations
       WHERE UPPER(id) = $1
          OR UPPER(id) = $2
          OR (LENGTH($1) = 6 AND UPPER(id) LIKE '%' || $1)
       FOR UPDATE`,
      [normId, `RES${normId}`]
    );

    if (resQuery.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Reservation not found", status: 404 };
    }

    const reservation = mapRowToReservation(resQuery.rows[0]);

    if (reservation.status === "cancelled") {
      await client.query("ROLLBACK");
      return { success: false, error: "Reservation is already cancelled", status: 409 };
    }

    // If reservation was active, release the booked quota atomically
    if (reservation.status === "active") {
      await client.query(
        "UPDATE time_slots SET booked = GREATEST(booked - 1, 0) WHERE id = $1",
        [reservation.slotId]
      );
    }

    await client.query(
      "UPDATE reservations SET status = 'cancelled' WHERE id = $1",
      [reservation.id]
    );

    await client.query("COMMIT");
    reservation.status = "cancelled";
    return { success: true, data: reservation, status: 200 };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Checks in a student inside an atomic PostgreSQL TRANSACTION.
 */
export async function pgCheckInReservationTx(id: string): Promise<TxResult<Reservation>> {
  await initPostgresSchema();
  const pool = getPgPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const normId = id.trim().toUpperCase();
    const resQuery = await client.query<ReservationRow>(
      `SELECT * FROM reservations
       WHERE UPPER(id) = $1
          OR UPPER(id) = $2
          OR (LENGTH($1) = 6 AND UPPER(id) LIKE '%' || $1)
       FOR UPDATE`,
      [normId, `RES${normId}`]
    );

    if (resQuery.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Reservation not found", status: 404 };
    }

    const reservation = mapRowToReservation(resQuery.rows[0]);

    if (reservation.status === "checked-in") {
      await client.query("ROLLBACK");
      return { success: false, error: "Already checked in", status: 409 };
    }

    if (reservation.status === "cancelled") {
      await client.query("ROLLBACK");
      return { success: false, error: "Reservation is cancelled", status: 409 };
    }

    await client.query(
      "UPDATE reservations SET status = 'checked-in' WHERE id = $1",
      [reservation.id]
    );

    await client.query("COMMIT");
    reservation.status = "checked-in";
    return { success: true, data: reservation, status: 200 };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
