import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Configure isolated store path for test
const testStoreDir = await fs.mkdtemp(path.join(os.tmpdir(), "dormdine-report-test-"));
process.env.DORM_DINE_STORE_PATH = path.join(testStoreDir, "test-dormdine.json");

const { resetDb } = await import("../lib/store.ts");
const { GET: exportReports } = await import("../app/api/reports/export/route.ts");

test("Export daily attendance and slot utilization reports (CSV)", async (t) => {
  await t.test("exports attendance report as CSV with correct headers and rows", async () => {
    await resetDb();
    const req = new Request("http://localhost/api/reports/export?type=attendance");
    const res = await exportReports(req);

    assert.equal(res.status, 200);
    assert.ok(res.headers.get("Content-Type")?.includes("text/csv"));
    assert.ok(res.headers.get("Content-Disposition")?.includes("dormdine-attendance-report-"));

    const csv = await res.text();
    const lines = csv.split("\n");
    assert.ok(lines.length >= 2);

    // Verify CSV Header line
    assert.equal(
      lines[0],
      "Reservation ID,Student Name,Student ID,Meal,Date,Slot Time,Status,Created At"
    );

    // Verify first data line contains seed reservation
    assert.ok(lines[1].includes("RES001"));
    assert.ok(lines[1].includes("Demo Student"));
  });

  await t.test("exports slot utilization report as CSV with capacity and rates", async () => {
    await resetDb();
    const req = new Request("http://localhost/api/reports/export?type=slots");
    const res = await exportReports(req);

    assert.equal(res.status, 200);
    assert.ok(res.headers.get("Content-Type")?.includes("text/csv"));
    assert.ok(res.headers.get("Content-Disposition")?.includes("dormdine-slot-utilization-"));

    const csv = await res.text();
    const lines = csv.split("\n");
    assert.ok(lines.length >= 5);

    // Verify CSV Header line
    assert.equal(
      lines[0],
      "Slot ID,Meal,Start Time,End Time,Capacity,Booked,Occupancy Rate,Status"
    );

    // Verify data lines have percentage and valid columns
    assert.ok(lines[1].includes("BREAKFAST") || lines[1].includes("LUNCH"));
    assert.ok(lines[1].includes("%"));
  });
});
