import type { NextRequest } from "next/server";
import { getDb } from "../../../../lib/store.ts";

function escapeCsvField(field: unknown): string {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "attendance";
  const today = new Date().toISOString().split("T")[0];
  const db = await getDb();

  if (type === "slots" || type === "utilization") {
    // Slot utilization report
    const headers = [
      "Slot ID",
      "Meal",
      "Start Time",
      "End Time",
      "Capacity",
      "Booked",
      "Occupancy Rate",
      "Status",
    ];

    const rows = db.slots.map((slot) => {
      const rate = slot.capacity > 0 ? Math.round((slot.booked / slot.capacity) * 100) : 0;
      return [
        slot.id,
        slot.meal.toUpperCase(),
        slot.startTime,
        slot.endTime,
        slot.capacity,
        slot.booked,
        `${rate}%`,
        slot.disabled ? "DISABLED" : slot.booked >= slot.capacity ? "FULL" : "ACTIVE",
      ]
        .map(escapeCsvField)
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const filename = `dormdine-slot-utilization-${today}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Default: Attendance & Reservation Report
  const headers = [
    "Reservation ID",
    "Student Name",
    "Student ID",
    "Meal",
    "Date",
    "Slot Time",
    "Status",
    "Created At",
  ];

  const rows = db.reservations.map((r) => {
    return [
      r.id,
      r.studentName,
      r.studentId,
      r.meal.toUpperCase(),
      r.date,
      `${r.startTime} - ${r.endTime}`,
      r.status.toUpperCase(),
      r.createdAt,
    ]
      .map(escapeCsvField)
      .join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const filename = `dormdine-attendance-report-${today}.csv`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
