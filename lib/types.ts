export type Meal = "breakfast" | "lunch" | "dinner";

export interface TimeSlot {
  id: string;
  meal: Meal;
  startTime: string; // e.g. "12:00"
  endTime: string;   // e.g. "12:30"
  capacity: number;
  booked: number;
}

export interface Reservation {
  id: string;
  studentName: string;
  studentId: string;
  slotId: string;
  meal: Meal;
  startTime: string;
  endTime: string;
  date: string;
  status: "active" | "checked-in" | "cancelled";
  createdAt: string;
}
