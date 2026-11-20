import { promises as fs } from "fs";
import path from "path";
import type { TimeSlot, Reservation } from "./types.ts";
import { createSeedSlots, createSeedReservations } from "./mockStore.ts";
import {
  isPostgresConfigured,
  getPgPool,
  closePgPool,
  pgGetSlots,
  pgGetReservations,
  pgResetDb,
  pgCreateReservationTx,
  pgCancelReservationTx,
  pgCheckInReservationTx,
  pgGetSlotById,
  pgCreateSlot,
  pgUpdateSlot,
  pgDeleteSlot,
  pgGetReservationById,
} from "./db/index.ts";

export {
  isPostgresConfigured,
  getPgPool,
  closePgPool,
  pgGetSlots,
  pgGetReservations,
  pgResetDb,
  pgCreateReservationTx,
  pgCancelReservationTx,
  pgCheckInReservationTx,
  pgGetSlotById,
  pgCreateSlot,
  pgUpdateSlot,
  pgDeleteSlot,
  pgGetReservationById,
};

export interface DbState {
  slots: TimeSlot[];
  reservations: Reservation[];
}

type StoreGlobal = typeof globalThis & {
  __dormDineDb?: DbState;
  __dormDineDbLoading?: Promise<DbState>;
};

const g = globalThis as StoreGlobal;

function isMemoryMode(): boolean {
  return process.env.DORMDINE_STORAGE === "memory";
}

export function getDataFilePath(): string {
  const configured = process.env.DORMDINE_DATA_FILE || process.env.DORM_DINE_STORE_PATH;
  if (configured) return path.resolve(configured);
  return path.join(process.cwd(), ".data", "dormdine.json");
}

function createSeedState(): DbState {
  return { slots: createSeedSlots(), reservations: createSeedReservations() };
}

function isValidState(value: unknown): value is DbState {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as DbState).slots) &&
    Array.isArray((value as DbState).reservations)
  );
}

async function loadFromDisk(): Promise<DbState> {
  if (isMemoryMode()) return createSeedState();

  const file = getDataFilePath();
  try {
    const raw = await fs.readFile(/*turbopackIgnore: true*/ file, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (isValidState(parsed)) return parsed;
    console.warn(`[store] Invalid data in ${file}; re-seeding.`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(`[store] Could not read ${file}; re-seeding.`, err);
    }
  }

  const seeded = createSeedState();
  await writeToDisk(seeded);
  return seeded;
}

async function writeToDisk(state: DbState): Promise<void> {
  if (isMemoryMode()) return;
  const file = getDataFilePath();
  await fs.mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify(state, null, 2), "utf8");
  await fs.rename(/*turbopackIgnore: true*/ tmp, file);
}

/** Returns the live store state (from PostgreSQL if configured, or from disk/memory). */
export async function getDb(): Promise<DbState> {
  if (isPostgresConfigured()) {
    const [slots, reservations] = await Promise.all([
      pgGetSlots({ includeDisabled: true }),
      pgGetReservations(),
    ]);
    return { slots, reservations };
  }

  if (g.__dormDineDb) return g.__dormDineDb;
  if (!g.__dormDineDbLoading) {
    g.__dormDineDbLoading = loadFromDisk().then((state) => {
      g.__dormDineDb = state;
      g.__dormDineDbLoading = undefined;
      return state;
    });
  }
  return g.__dormDineDbLoading;
}

/** Persists state (no-op in PostgreSQL since transactions commit immediately). */
export async function saveDb(): Promise<void> {
  if (isPostgresConfigured()) {
    return;
  }
  const state = await getDb();
  await writeToDisk(state);
}

/** Replaces the store contents (defaults to seed data). Intended for tests. */
export async function resetDb(state?: DbState): Promise<DbState> {
  if (isPostgresConfigured()) {
    await pgResetDb(state?.slots, state?.reservations);
    return getDb();
  }

  const next = state ?? createSeedState();
  g.__dormDineDb = next;
  g.__dormDineDbLoading = undefined;
  await writeToDisk(next);
  return next;
}

/**
 * Concurrency lock handling to prevent slot overbooking in non-Postgres storage.
 */
const slotLocks = new Map<string, Promise<void>>();

export async function withSlotLock<T>(slotId: string, fn: () => Promise<T>): Promise<T> {
  const previousLock = slotLocks.get(slotId) ?? Promise.resolve();
  let release: () => void;
  const currentLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  slotLocks.set(slotId, currentLock);

  try {
    await previousLock;
    return await fn();
  } finally {
    release!();
    if (slotLocks.get(slotId) === currentLock) {
      slotLocks.delete(slotId);
    }
  }
}
