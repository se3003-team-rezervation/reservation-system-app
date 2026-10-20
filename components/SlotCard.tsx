"use client";
import { TimeSlot } from "@/lib/types";
import { Clock, Users } from "lucide-react";

interface SlotCardProps {
  slot: TimeSlot;
  selected: boolean;
  onClick: () => void;
}

export default function SlotCard({ slot, selected, onClick }: SlotCardProps) {
  const isFull = slot.booked >= slot.capacity;
  const pct = Math.round((slot.booked / slot.capacity) * 100);
  const available = slot.capacity - slot.booked;

  const fillColor =
    pct >= 90
      ? "#f43f5e"
      : pct >= 60
      ? "#f59e0b"
      : "#10b981";

  return (
    <button
      onClick={isFull ? undefined : onClick}
      id={`slot-${slot.id}`}
      disabled={isFull}
      aria-pressed={selected}
      aria-label={`${slot.startTime}–${slot.endTime}, ${available} spots remaining`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        padding: "1.25rem",
        borderRadius: "1rem",
        cursor: isFull ? "not-allowed" : "pointer",
        border: selected
          ? "2px solid rgba(99,102,241,0.7)"
          : isFull
          ? "2px solid rgba(244,63,94,0.25)"
          : "2px solid rgba(255,255,255,0.1)",
        background: selected
          ? "rgba(99,102,241,0.18)"
          : isFull
          ? "rgba(244,63,94,0.06)"
          : "rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        opacity: isFull ? 0.55 : 1,
        transform: selected ? "translateY(-2px)" : "translateY(0)",
        boxShadow: selected ? "0 8px 24px rgba(99,102,241,0.3)" : "none",
        transition: "all 0.2s ease",
        width: "100%",
        textAlign: "left",
      }}
    >
      {/* Time row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "white" }}>
            {slot.startTime} – {slot.endTime}
          </span>
        </div>
        {isFull ? (
          <span className="badge badge-full">Full</span>
        ) : selected ? (
          <span className="badge badge-active">Selected</span>
        ) : null}
      </div>

      {/* Progress bar */}
      <div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${pct}%`, background: fillColor }}
          />
        </div>
      </div>

      {/* Capacity info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <Users size={13} style={{ color: "rgba(255,255,255,0.45)" }} />
          <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)" }}>
            {slot.booked} / {slot.capacity} booked
          </span>
        </div>
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: isFull ? "#fda4af" : "#6ee7b7",
          }}
        >
          {isFull ? "No spots left" : `${available} available`}
        </span>
      </div>
    </button>
  );
}
