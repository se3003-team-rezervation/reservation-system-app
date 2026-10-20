"use client";
import { TimeSlot } from "@/lib/types";
import { Users } from "lucide-react";

const MEAL_LABEL: Record<string, string> = {
  breakfast: "☕ Breakfast",
  lunch: "🍽️ Lunch",
  dinner: "🌙 Dinner",
};

interface SlotOccupancyBarProps {
  slots: TimeSlot[];
}

export default function SlotOccupancyBar({ slots }: SlotOccupancyBarProps) {
  // Group by meal
  const meals = ["breakfast", "lunch", "dinner"] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {meals.map((meal) => {
        const mealSlots = slots.filter((s) => s.meal === meal);
        if (!mealSlots.length) return null;
        return (
          <div key={meal}>
            <h3
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "rgba(255,255,255,0.85)",
                marginBottom: "0.875rem",
              }}
            >
              {MEAL_LABEL[meal]}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {mealSlots.map((slot) => {
                const pct = Math.round((slot.booked / slot.capacity) * 100);
                const isFull = slot.booked >= slot.capacity;
                const fillColor = isFull
                  ? "#f43f5e"
                  : pct >= 70
                  ? "#f59e0b"
                  : "#10b981";

                return (
                  <div
                    key={slot.id}
                    style={{
                      padding: "0.875rem 1.125rem",
                      borderRadius: "0.875rem",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.09)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "0.9375rem",
                          color: "white",
                        }}
                      >
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          color: "rgba(255,255,255,0.55)",
                          fontSize: "0.8125rem",
                        }}
                      >
                        <Users size={13} />
                        <span>
                          {slot.booked} / {slot.capacity}
                        </span>
                        <span
                          style={{
                            padding: "0.1rem 0.5rem",
                            borderRadius: 9999,
                            background: `${fillColor}22`,
                            color: fillColor,
                            border: `1px solid ${fillColor}44`,
                            fontWeight: 700,
                            fontSize: "0.75rem",
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: fillColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
