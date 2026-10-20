"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import SlotCard from "@/components/SlotCard";
import QRDisplay from "@/components/QRDisplay";
import { TimeSlot, Reservation } from "@/lib/types";
import { ArrowLeft, Loader2 } from "lucide-react";

const MEAL_LABEL: Record<string, string> = {
  breakfast: "☕ Breakfast",
  lunch: "🍽️ Lunch",
  dinner: "🌙 Dinner",
};

function ReserveContent() {
  const params = useSearchParams();
  const router = useRouter();
  const meal = params.get("meal") || "";
  const studentName = params.get("name") || "";
  const studentId = params.get("sid") || "";

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!meal) return;
    fetch(`/api/slots?meal=${meal}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [meal]);

  async function handleReserve() {
    if (!selectedSlot) { setError("Please select a time slot."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, studentId, slotId: selectedSlot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create reservation.");
      } else {
        setReservation(data);
        // Persist to localStorage
        const existing = JSON.parse(localStorage.getItem("dormDineReservations") || "[]");
        existing.push(data);
        localStorage.setItem("dormDineReservations", JSON.stringify(existing));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (reservation) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "2.5rem 1.25rem 4rem",
          }}
        >
          <QRDisplay reservation={reservation} />
          <button
            className="btn-secondary"
            onClick={() => router.push("/my-reservations")}
            id="go-to-my-reservations"
            style={{ marginTop: "1.5rem" }}
          >
            View My Reservations
          </button>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          maxWidth: 640,
          margin: "0 auto",
          width: "100%",
          padding: "2rem 1.25rem 4rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Back + title */}
        <div>
          <button
            onClick={() => router.back()}
            className="btn-secondary"
            id="back-btn"
            style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", marginBottom: "1.25rem" }}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <h1
            style={{
              fontWeight: 800,
              fontSize: "1.625rem",
              color: "white",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Select a Time Slot
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", marginTop: "0.375rem" }}>
            {MEAL_LABEL[meal]} · {studentName}
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <Loader2 size={32} color="#818cf8" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {slots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                selected={selectedSlot === slot.id}
                onClick={() => setSelectedSlot(slot.id)}
              />
            ))}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              background: "rgba(244,63,94,0.15)",
              border: "1px solid rgba(244,63,94,0.3)",
              color: "#fda4af",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        {!loading && (
          <button
            className="btn-primary"
            onClick={handleReserve}
            disabled={!selectedSlot || submitting}
            id="confirm-reservation"
            style={{ alignSelf: "flex-end" }}
          >
            {submitting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
            {submitting ? "Reserving…" : "Confirm Reservation"}
          </button>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </main>
    </div>
  );
}

export default function ReservePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={40} color="#818cf8" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ReserveContent />
    </Suspense>
  );
}
