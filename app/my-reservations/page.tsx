"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import QRDisplay from "@/components/QRDisplay";
import { Reservation } from "@/lib/types";
import { CalendarCheck, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

const MEAL_LABEL: Record<string, string> = {
  breakfast: "☕ Breakfast",
  lunch: "🍽️ Lunch",
  dinner: "🌙 Dinner",
};

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = JSON.parse(localStorage.getItem("dormDineReservations") || "[]");
    setReservations(stored);
    if (stored.length > 0) setSelected(stored[stored.length - 1]);
  }, []);

  function removeReservation(id: string) {
    const updated = reservations.filter((r) => r.id !== id);
    setReservations(updated);
    localStorage.setItem("dormDineReservations", JSON.stringify(updated));
    if (selected?.id === id) setSelected(updated.length > 0 ? updated[updated.length - 1] : null);
  }

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          maxWidth: 900,
          margin: "0 auto",
          width: "100%",
          padding: "2rem 1.25rem 4rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1
              style={{
                fontWeight: 800,
                fontSize: "1.75rem",
                color: "white",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              My Reservations
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", marginTop: "0.3rem" }}>
              {reservations.length === 0 ? "No reservations yet" : `${reservations.length} reservation(s)`}
            </p>
          </div>
          <Link href="/" className="btn-primary" id="new-reservation-btn" style={{ textDecoration: "none" }}>
            <Plus size={15} />
            New
          </Link>
        </div>

        {reservations.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              padding: "5rem 2rem",
              textAlign: "center",
            }}
          >
            <CalendarCheck size={52} color="rgba(255,255,255,0.15)" />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1rem" }}>
              You haven&apos;t made any reservations yet.
            </p>
            <Link href="/" className="btn-primary" style={{ textDecoration: "none" }}>
              Make a Reservation
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "2rem",
            }}
          >
            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {reservations.map((res) => {
                const isActive = selected?.id === res.id;
                return (
                  <button
                    key={res.id}
                    id={`reservation-item-${res.id}`}
                    onClick={() => setSelected(res)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1rem 1.25rem",
                      borderRadius: "1rem",
                      background: isActive ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.05)",
                      border: isActive ? "2px solid rgba(99,102,241,0.5)" : "2px solid rgba(255,255,255,0.08)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 700, color: "white", margin: 0, fontSize: "0.9375rem" }}>
                        {MEAL_LABEL[res.meal]}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", margin: "0.2rem 0 0" }}>
                        {res.startTime} – {res.endTime} · {res.date}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", margin: "0.15rem 0 0", fontFamily: "monospace" }}>
                        {res.id}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span
                        className={res.status === "checked-in" ? "badge badge-checked" : "badge badge-active"}
                      >
                        {res.status === "checked-in" ? "Checked In" : "Active"}
                      </span>
                      <button
                        id={`remove-reservation-${res.id}`}
                        onClick={(e) => { e.stopPropagation(); removeReservation(res.id); }}
                        aria-label="Remove reservation"
                        style={{
                          background: "rgba(244,63,94,0.12)",
                          border: "1px solid rgba(244,63,94,0.25)",
                          borderRadius: "0.5rem",
                          width: 28,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#fda4af",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* QR Detail */}
            {selected && (
              <div className="animate-fade-up">
                <QRDisplay reservation={selected} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
