"use client";
import { Meal } from "@/lib/types";
import { Coffee, Sun, Moon } from "lucide-react";

const MEAL_CONFIG: Record<
  Meal,
  { label: string; emoji: string; time: string; gradient: string; icon: React.FC<{size:number}> }
> = {
  breakfast: {
    label: "Breakfast",
    emoji: "☕",
    time: "07:00 – 09:00",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    icon: Coffee,
  },
  lunch: {
    label: "Lunch",
    emoji: "🍽️",
    time: "11:30 – 13:30",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    icon: Sun,
  },
  dinner: {
    label: "Dinner",
    emoji: "🌙",
    time: "17:30 – 19:30",
    gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
    icon: Moon,
  },
};

interface MealCardProps {
  meal: Meal;
  selected: boolean;
  onClick: () => void;
}

export default function MealCard({ meal, selected, onClick }: MealCardProps) {
  const config = MEAL_CONFIG[meal];
  return (
    <button
      onClick={onClick}
      id={`meal-card-${meal}`}
      aria-pressed={selected}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.875rem",
        padding: "1.75rem 1.25rem",
        borderRadius: "1.25rem",
        cursor: "pointer",
        border: selected
          ? "2px solid rgba(255,255,255,0.35)"
          : "2px solid rgba(255,255,255,0.08)",
        background: selected
          ? "rgba(255,255,255,0.12)"
          : "rgba(255,255,255,0.05)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transition: "all 0.22s ease",
        transform: selected ? "translateY(-4px)" : "translateY(0)",
        boxShadow: selected
          ? "0 12px 32px rgba(0,0,0,0.3)"
          : "0 2px 8px rgba(0,0,0,0.15)",
        width: "100%",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "1rem",
          background: config.gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.75rem",
          boxShadow: selected ? "0 6px 20px rgba(0,0,0,0.3)" : "none",
          transition: "box-shadow 0.22s ease",
        }}
      >
        {config.emoji}
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: "1.0625rem", color: "white", margin: 0 }}>
          {config.label}
        </p>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)", marginTop: "0.2rem" }}>
          {config.time}
        </p>
      </div>
      {selected && (
        <span
          style={{
            padding: "0.2rem 0.75rem",
            borderRadius: 9999,
            background: "rgba(99,102,241,0.3)",
            color: "#a5b4fc",
            fontSize: "0.75rem",
            fontWeight: 600,
            border: "1px solid rgba(99,102,241,0.4)",
          }}
        >
          Selected
        </span>
      )}
    </button>
  );
}
