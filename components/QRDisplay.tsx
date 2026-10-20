"use client";
import { QRCodeSVG } from "qrcode.react";
import { Reservation } from "@/lib/types";
import { CheckCircle2, Clock, UtensilsCrossed, Hash } from "lucide-react";

interface QRDisplayProps {
  reservation: Reservation;
}

const MEAL_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export default function QRDisplay({ reservation }: QRDisplayProps) {
  const qrValue = JSON.stringify({
    id: reservation.id,
    studentId: reservation.studentId,
    meal: reservation.meal,
    date: reservation.date,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
        padding: "2rem 1.5rem",
        borderRadius: "1.5rem",
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.15)",
        maxWidth: 380,
        width: "100%",
        margin: "0 auto",
      }}
      className="animate-fade-up"
    >
      {/* Success header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: "0.75rem" }}>
          <div
            className="pulse-ring"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "rgba(16,185,129,0.35)",
            }}
          />
          <CheckCircle2 size={52} color="#10b981" />
        </div>
        <h2 style={{ fontWeight: 800, fontSize: "1.25rem", color: "white", margin: 0 }}>
          Reservation Confirmed!
        </h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Show this QR code at the entrance
        </p>
      </div>

      {/* QR Code */}
      <div
        style={{
          padding: "1rem",
          background: "white",
          borderRadius: "1rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <QRCodeSVG
          value={qrValue}
          size={192}
          level="H"
          includeMargin={false}
        />
      </div>

      {/* Reservation details */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "0.625rem",
        }}
      >
        <DetailRow icon={<Hash size={14} />} label="Reservation ID" value={reservation.id} mono />
        <DetailRow
          icon={<UtensilsCrossed size={14} />}
          label="Meal"
          value={MEAL_LABEL[reservation.meal]}
        />
        <DetailRow
          icon={<Clock size={14} />}
          label="Time Slot"
          value={`${reservation.startTime} – ${reservation.endTime}`}
        />
        <DetailRow icon={<Clock size={14} />} label="Date" value={reservation.date} />
      </div>

      {/* Status badge */}
      <span
        style={{
          padding: "0.35rem 1.25rem",
          borderRadius: 9999,
          background:
            reservation.status === "checked-in"
              ? "rgba(99,102,241,0.25)"
              : "rgba(16,185,129,0.2)",
          color: reservation.status === "checked-in" ? "#a5b4fc" : "#6ee7b7",
          fontSize: "0.8125rem",
          fontWeight: 700,
          border:
            reservation.status === "checked-in"
              ? "1px solid rgba(99,102,241,0.35)"
              : "1px solid rgba(16,185,129,0.3)",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        }}
      >
        {reservation.status === "checked-in" ? "✓ Checked In" : "● Active"}
      </span>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.5rem 0.875rem",
        borderRadius: "0.625rem",
        background: "rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          color: "rgba(255,255,255,0.5)",
          fontSize: "0.8125rem",
        }}
      >
        {icon}
        {label}
      </div>
      <span
        style={{
          color: "white",
          fontWeight: 600,
          fontSize: "0.875rem",
          fontFamily: mono ? "monospace" : "inherit",
          letterSpacing: mono ? "0.05em" : "inherit",
        }}
      >
        {value}
      </span>
    </div>
  );
}
