"use client";
import { useMemo } from "react";
import { TimeSlot, Reservation, Meal } from "@/lib/types";
import { TrendingUp, Flame, Clock, CheckCircle2 } from "lucide-react";

interface OccupancyAnalyticsProps {
  slots: TimeSlot[];
  reservations: Reservation[];
}

const MEAL_LABELS: Record<Meal, string> = {
  breakfast: "☕ Breakfast",
  lunch: "🍽️ Lunch",
  dinner: "🌙 Dinner",
};

export default function OccupancyAnalytics({ slots, reservations }: OccupancyAnalyticsProps) {
  // Aggregate meal-level statistics
  const mealStats = useMemo(() => {
    const meals: Meal[] = ["breakfast", "lunch", "dinner"];
    return meals.map((meal) => {
      const mealSlots = slots.filter((s) => s.meal === meal);
      const capacity = mealSlots.reduce((acc, s) => acc + s.capacity, 0);
      const booked = mealSlots.reduce((acc, s) => acc + s.booked, 0);
      const percentage = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;
      return {
        meal,
        label: MEAL_LABELS[meal],
        capacity,
        booked,
        percentage,
        slotsCount: mealSlots.length,
      };
    });
  }, [slots]);

  // Total cafeteria statistics
  const totalCapacity = useMemo(() => slots.reduce((acc, s) => acc + s.capacity, 0), [slots]);
  const totalBooked = useMemo(() => slots.reduce((acc, s) => acc + s.booked, 0), [slots]);
  const overallRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

  // Check-in conversion stats
  const activeCount = reservations.filter((r) => r.status === "active").length;
  const checkedInCount = reservations.filter((r) => r.status === "checked-in").length;
  const totalExpected = activeCount + checkedInCount;
  const checkInRate = totalExpected > 0 ? Math.round((checkedInCount / totalExpected) * 100) : 0;

  // Peak slots (occupancy >= 80% or full)
  const peakSlots = useMemo(() => {
    return slots
      .filter((s) => !s.disabled && s.capacity > 0 && s.booked / s.capacity >= 0.8)
      .sort((a, b) => b.booked / b.capacity - a.booked / a.capacity);
  }, [slots]);

  const getBarColor = (pct: number) => {
    if (pct >= 90) return "#f43f5e"; // Rose
    if (pct >= 75) return "#fbbf24"; // Amber
    if (pct >= 50) return "#818cf8"; // Indigo
    return "#34d399"; // Emerald
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} className="animate-fade-up">
      {/* Top Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {/* Overall Occupancy Rate */}
        <div
          className="glass"
          style={{
            padding: "1.25rem",
            borderRadius: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", fontWeight: 600 }}>
              Occupancy Rate
            </span>
            <TrendingUp size={16} color="#818cf8" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "2rem", fontWeight: 800, color: "white", lineHeight: 1 }}>
              {overallRate}%
            </span>
            <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>
              {totalBooked} / {totalCapacity} seats
            </span>
          </div>
          {/* Mini progress bar */}
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
              marginTop: "0.25rem",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(overallRate, 100)}%`,
                background: getBarColor(overallRate),
                borderRadius: 3,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Check-in Attendance */}
        <div
          className="glass"
          style={{
            padding: "1.25rem",
            borderRadius: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", fontWeight: 600 }}>
              Check-in Rate
            </span>
            <CheckCircle2 size={16} color="#34d399" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "2rem", fontWeight: 800, color: "white", lineHeight: 1 }}>
              {checkInRate}%
            </span>
            <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>
              {checkedInCount} of {totalExpected} checked in
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
              marginTop: "0.25rem",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(checkInRate, 100)}%`,
                background: "#34d399",
                borderRadius: 3,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Peak Demand Alert */}
        <div
          className="glass"
          style={{
            padding: "1.25rem",
            borderRadius: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", fontWeight: 600 }}>
              Peak Slots (&gt;80%)
            </span>
            <Flame size={16} color="#fbbf24" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "2rem", fontWeight: 800, color: peakSlots.length > 0 ? "#fbbf24" : "white", lineHeight: 1 }}>
              {peakSlots.length}
            </span>
            <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>
              {peakSlots.length === 0 ? "Normal load" : "High traffic slots"}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
            {peakSlots.length > 0 ? "Requires extra staff attention" : "Capacity well balanced"}
          </p>
        </div>
      </div>

      {/* Meal Breakdown Bars */}
      <div className="glass" style={{ padding: "1.5rem", borderRadius: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "white" }}>
          Meal Session Occupancy
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {mealStats.map((stat) => (
            <div key={stat.meal} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "white" }}>
                  {stat.label}
                </span>
                <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)" }}>
                  <strong style={{ color: "white" }}>{stat.booked}</strong> / {stat.capacity} seats ({stat.percentage}%)
                </span>
              </div>
              <div
                style={{
                  height: 10,
                  borderRadius: 5,
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(stat.percentage, 100)}%`,
                    background: getBarColor(stat.percentage),
                    borderRadius: 5,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slot-by-Slot Occupancy Distribution Chart */}
      <div className="glass" style={{ padding: "1.5rem", borderRadius: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "white" }}>
              Real-Time Slot Occupancy Distribution
            </h3>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>
              Live seat allocation per service window
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.75rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "rgba(255,255,255,0.6)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#34d399" }} /> &lt;50%
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "rgba(255,255,255,0.6)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#818cf8" }} /> 50-75%
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "rgba(255,255,255,0.6)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#fbbf24" }} /> 75-90%
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "rgba(255,255,255,0.6)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#f43f5e" }} /> &gt;90%
            </span>
          </div>
        </div>

        {/* Visual Chart Bars */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {slots.map((slot) => {
            const pct = slot.capacity > 0 ? Math.round((slot.booked / slot.capacity) * 100) : 0;
            const isFull = slot.booked >= slot.capacity;
            const barColor = slot.disabled ? "rgba(255,255,255,0.2)" : getBarColor(pct);

            return (
              <div
                key={slot.id}
                style={{
                  padding: "0.875rem",
                  borderRadius: "0.875rem",
                  background: "rgba(255,255,255,0.04)",
                  border: isFull
                    ? "1px solid rgba(244,63,94,0.4)"
                    : slot.disabled
                    ? "1px dashed rgba(255,255,255,0.15)"
                    : "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                    {slot.meal}
                  </span>
                  {slot.disabled ? (
                    <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                      Disabled
                    </span>
                  ) : isFull ? (
                    <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", background: "rgba(244,63,94,0.25)", color: "#fda4af", fontWeight: 700 }}>
                      FULL
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: barColor }}>
                      {pct}%
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Clock size={12} color="rgba(255,255,255,0.45)" />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "white" }}>
                    {slot.startTime}–{slot.endTime}
                  </span>
                </div>

                {/* Vertical Fill Meter */}
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(pct, 100)}%`,
                      background: barColor,
                      borderRadius: 4,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                  <span>Booked:</span>
                  <span style={{ fontWeight: 600, color: "white" }}>
                    {slot.booked}/{slot.capacity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
