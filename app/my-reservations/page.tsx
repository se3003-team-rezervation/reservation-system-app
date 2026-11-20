"use client";
import { useState, useSyncExternalStore, useMemo } from "react";
import Navbar from "@/components/Navbar";
import QRDisplay from "@/components/QRDisplay";
import { Reservation } from "@/lib/types";
import {
  CalendarCheck,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  QrCode,
  ChevronRight,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";

const MEAL_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "☕",
  lunch: "🍽️",
  dinner: "🌙",
};

const MEAL_GRADIENT: Record<string, string> = {
  breakfast: "linear-gradient(135deg, #f59e0b, #d97706)",
  lunch: "linear-gradient(135deg, #10b981, #059669)",
  dinner: "linear-gradient(135deg, #6366f1, #4f46e5)",
};

type Tab = "active" | "all";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("dormDineReservationsChange", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("dormDineReservationsChange", callback);
  };
}

function getReservationsSnapshot(): string {
  return localStorage.getItem("dormDineReservations") || "[]";
}

const SERVER_SNAPSHOT = "[]";
function getServerSnapshot(): string {
  return SERVER_SNAPSHOT;
}

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function MyReservationsPage() {
  const mounted = useIsMounted();
  const rawReservations = useSyncExternalStore(
    subscribe,
    getReservationsSnapshot,
    getServerSnapshot
  );

  const reservations: Reservation[] = useMemo(() => {
    try {
      return JSON.parse(rawReservations);
    } catch {
      return [];
    }
  }, [rawReservations]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("active");
  const [showQR, setShowQR] = useState(false);

  const activeReservations = useMemo(
    () => reservations.filter((r) => r.status === "active"),
    [reservations]
  );

  const selected = useMemo(() => {
    if (selectedId) {
      const found = reservations.find((r) => r.id === selectedId);
      if (found) return found;
    }
    const latestActive = [...reservations].reverse().find((r) => r.status === "active");
    return latestActive ?? reservations[reservations.length - 1] ?? null;
  }, [reservations, selectedId]);

  function removeReservation(id: string) {
    try {
      const stored: Reservation[] = JSON.parse(
        localStorage.getItem("dormDineReservations") || "[]"
      );
      const updated = stored.filter((r) => r.id !== id);
      localStorage.setItem("dormDineReservations", JSON.stringify(updated));
      window.dispatchEvent(new Event("dormDineReservationsChange"));
      if (selected?.id === id) {
        const next = updated.find((r) => r.status === "active") ?? updated[updated.length - 1] ?? null;
        setSelectedId(next ? next.id : null);
      }
    } catch {
      // ignore
    }
  }

  if (!mounted) return null;

  const displayed = tab === "active" ? activeReservations : reservations;

  const tabStyle = (t: Tab) => ({
    padding: "0.45rem 1.1rem",
    borderRadius: "0.625rem",
    fontWeight: tab === t ? 600 : 500,
    fontSize: "0.875rem",
    cursor: "pointer",
    border: tab === t ? "1px solid rgba(99,102,241,0.45)" : "1px solid transparent",
    background: tab === t ? "rgba(99,102,241,0.22)" : "transparent",
    color: tab === t ? "white" : "rgba(255,255,255,0.5)",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
  });

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main
        style={{
          flex: 1,
          maxWidth: 960,
          margin: "0 auto",
          width: "100%",
          padding: "2rem 1.25rem 4rem",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1.75rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontWeight: 800,
                fontSize: "1.875rem",
                color: "white",
                margin: 0,
                letterSpacing: "-0.025em",
              }}
            >
              My Reservations
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", marginTop: "0.35rem" }}>
              {activeReservations.length > 0
                ? `${activeReservations.length} active · ${reservations.length} total`
                : reservations.length > 0
                ? `${reservations.length} reservation(s) — none active`
                : "No reservations yet"}
            </p>
          </div>

          <Link
            href="/"
            id="new-reservation-btn"
            className="btn-primary"
            style={{ textDecoration: "none", whiteSpace: "nowrap" }}
          >
            <Plus size={15} />
            New Reservation
          </Link>
        </div>

        {/* ── Tabs ── */}
        {reservations.length > 0 && (
          <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1.25rem" }}>
            <button
              style={tabStyle("active")}
              onClick={() => setTab("active")}
              id="tab-active-reservations"
            >
              <Clock size={13} />
              Active
              {activeReservations.length > 0 && (
                <span
                  style={{
                    background: "rgba(99,102,241,0.4)",
                    borderRadius: 9999,
                    padding: "0.05rem 0.45rem",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}
                >
                  {activeReservations.length}
                </span>
              )}
            </button>
            <button
              style={tabStyle("all")}
              onClick={() => setTab("all")}
              id="tab-all-reservations"
            >
              <CalendarCheck size={13} />
              All Reservations
            </button>
          </div>
        )}

        {/* ── Empty State ── */}
        {displayed.length === 0 ? (
          <div
            className="animate-fade-up"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.25rem",
              padding: "5rem 2rem",
              textAlign: "center",
            }}
          >
            {tab === "active" && reservations.length > 0 ? (
              <>
                {/* Has past reservations but none active */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "1.5rem",
                    background: "rgba(99,102,241,0.12)",
                    border: "2px solid rgba(99,102,241,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={36} color="#818cf8" />
                </div>
                <div>
                  <p style={{ color: "white", fontSize: "1.0625rem", fontWeight: 700, margin: 0 }}>
                    No active reservations
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", marginTop: "0.4rem" }}>
                    All your reservations have been completed.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                  <Link href="/" className="btn-primary" style={{ textDecoration: "none" }}>
                    <Plus size={14} />
                    New Reservation
                  </Link>
                  <button
                    className="btn-secondary"
                    onClick={() => setTab("all")}
                    id="view-all-btn"
                  >
                    View History
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Completely empty */}
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "2rem",
                    background: "rgba(255,255,255,0.04)",
                    border: "2px dashed rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2.5rem",
                  }}
                >
                  🍽️
                </div>
                <div>
                  <p style={{ color: "white", fontSize: "1.0625rem", fontWeight: 700, margin: 0 }}>
                    No reservations yet
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", marginTop: "0.4rem", maxWidth: 300 }}>
                    Reserve a cafeteria slot to skip the queue and get your QR code.
                  </p>
                </div>
                <Link
                  href="/"
                  className="btn-primary"
                  id="empty-state-reserve-btn"
                  style={{ textDecoration: "none" }}
                >
                  <UtensilsCrossed size={15} />
                  Make My First Reservation
                </Link>
              </>
            )}
          </div>
        ) : (
          /* ── Content Grid ── */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: selected && showQR ? "1fr 1fr" : "1fr",
              gap: "1.5rem",
              alignItems: "start",
            }}
          >
            {/* Reservation list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {displayed.map((res) => {
                const isSelected = selected?.id === res.id;
                const isCheckedIn = res.status === "checked-in";

                return (
                  <div
                    key={res.id}
                    id={`reservation-item-${res.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedId(res.id);
                      setShowQR(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(res.id);
                        setShowQR(true);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "1rem 1.125rem",
                      borderRadius: "1rem",
                      background: isSelected && showQR
                        ? "rgba(99,102,241,0.18)"
                        : "rgba(255,255,255,0.05)",
                      border: isSelected && showQR
                        ? "2px solid rgba(99,102,241,0.5)"
                        : "2px solid rgba(255,255,255,0.08)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* Meal icon */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "0.75rem",
                        background: MEAL_GRADIENT[res.meal],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.25rem",
                        flexShrink: 0,
                        opacity: isCheckedIn ? 0.6 : 1,
                      }}
                    >
                      {MEAL_EMOJI[res.meal]}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <p style={{ fontWeight: 700, color: "white", margin: 0, fontSize: "0.9375rem" }}>
                          {MEAL_LABEL[res.meal]}
                        </p>
                        <span
                          className={isCheckedIn ? "badge badge-checked" : "badge badge-active"}
                        >
                          {isCheckedIn ? "✓ Checked In" : "● Active"}
                        </span>
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", margin: "0.2rem 0 0" }}>
                        {res.startTime} – {res.endTime} &nbsp;·&nbsp; {res.date}
                      </p>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.3)",
                          fontSize: "0.72rem",
                          margin: "0.15rem 0 0",
                          fontFamily: "monospace",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {res.id}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                      <button
                        id={`show-qr-${res.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(res.id);
                          setShowQR(true);
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(res.id);
                            setShowQR(true);
                          }
                        }}
                        aria-label="Show QR code"
                        title="Show QR"
                        style={{
                          background: "rgba(99,102,241,0.15)",
                          border: "1px solid rgba(99,102,241,0.3)",
                          borderRadius: "0.5rem",
                          width: 30,
                          height: 30,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#a5b4fc",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <QrCode size={14} />
                      </button>
                      <button
                        id={`remove-reservation-${res.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeReservation(res.id);
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            removeReservation(res.id);
                          }
                        }}
                        aria-label="Remove reservation"
                        title="Remove"
                        style={{
                          background: "rgba(244,63,94,0.1)",
                          border: "1px solid rgba(244,63,94,0.22)",
                          borderRadius: "0.5rem",
                          width: 30,
                          height: 30,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#fda4af",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                      <ChevronRight size={15} color="rgba(255,255,255,0.2)" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* QR Panel */}
            {selected && showQR && (
              <div className="animate-fade-up" style={{ position: "sticky", top: "5rem" }}>
                <QRDisplay reservation={selected} />
                <button
                  className="btn-secondary"
                  onClick={() => setShowQR(false)}
                  id="close-qr-btn"
                  style={{ width: "100%", marginTop: "0.75rem", justifyContent: "center" }}
                >
                  Close QR
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
