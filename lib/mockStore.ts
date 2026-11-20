import { TimeSlot, Reservation } from "./types";

/**
 * Seed data used to initialise the persistent store (see `lib/store.ts`)
 * the first time the app runs, or whenever the data file is missing.
 *
 * These factories return fresh copies every call so callers can safely mutate
 * the result without affecting future seeds (important for tests).
 */

export function createSeedSlots(): TimeSlot[] {
  return [
    // Breakfast 07:00 – 09:00
    { id: "b1", meal: "breakfast", startTime: "07:00", endTime: "07:30", capacity: 30, booked: 8 },
    { id: "b2", meal: "breakfast", startTime: "07:30", endTime: "08:00", capacity: 30, booked: 22 },
    { id: "b3", meal: "breakfast", startTime: "08:00", endTime: "08:30", capacity: 30, booked: 30 },
    { id: "b4", meal: "breakfast", startTime: "08:30", endTime: "09:00", capacity: 30, booked: 15 },

    // Lunch 11:30 – 13:30
    { id: "l1", meal: "lunch", startTime: "11:30", endTime: "12:00", capacity: 40, booked: 12 },
    { id: "l2", meal: "lunch", startTime: "12:00", endTime: "12:30", capacity: 40, booked: 38 },
    { id: "l3", meal: "lunch", startTime: "12:30", endTime: "13:00", capacity: 40, booked: 25 },
    { id: "l4", meal: "lunch", startTime: "13:00", endTime: "13:30", capacity: 40, booked: 7 },

    // Dinner 17:30 – 19:30
    { id: "d1", meal: "dinner", startTime: "17:30", endTime: "18:00", capacity: 35, booked: 20 },
    { id: "d2", meal: "dinner", startTime: "18:00", endTime: "18:30", capacity: 35, booked: 35 },
    { id: "d3", meal: "dinner", startTime: "18:30", endTime: "19:00", capacity: 35, booked: 10 },
    { id: "d4", meal: "dinner", startTime: "19:00", endTime: "19:30", capacity: 35, booked: 5 },
  ];
}

export function createSeedReservations(): Reservation[] {
  const now = new Date();
  return [
    {
      id: "RES001",
      studentName: "Demo Student",
      studentId: "S12345",
      slotId: "l3",
      meal: "lunch",
      startTime: "12:30",
      endTime: "13:00",
      date: now.toISOString().split("T")[0],
      status: "active",
      createdAt: now.toISOString(),
    },
  ];
}

export function generateReservationId(): string {
  return "RES" + Math.random().toString(36).substr(2, 6).toUpperCase();
}

/** Returns a human-readable label for a time slot, e.g. "12:00 – 12:30" */
export function formatSlotTime(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}
