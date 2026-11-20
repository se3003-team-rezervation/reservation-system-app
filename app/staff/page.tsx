"use client";
import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import SlotOccupancyBar from "@/components/SlotOccupancyBar";
import dynamic from "next/dynamic";
import { TimeSlot, Reservation, Meal } from "@/lib/types";
import {
  Camera,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  BarChart3,
  Loader2,
  RefreshCw,
  Sliders,
  Plus,
  Trash2,
  Power,
} from "lucide-react";

const QRScanner = dynamic(() => import("@/components/QRScanner"), {
  ssr: false,
  loading: () => (
    <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.4)" }}>
      Loading scanner…
    </div>
  ),
});

type CheckResult = { success: boolean; message: string; reservation?: Reservation };

const MEAL_LABEL: Record<string, string> = {
  breakfast: "☕ Breakfast",
  lunch: "🍽️ Lunch",
  dinner: "🌙 Dinner",
};

export default function StaffPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "checkin" | "slots">("overview");
  const [processing, setProcessing] = useState(false);

  // New slot form state
  const [newMeal, setNewMeal] = useState<Meal>("breakfast");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newCapacity, setNewCapacity] = useState(30);
  const [slotActionLoading, setSlotActionLoading] = useState(false);
  const [slotFeedback, setSlotFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [slotsRes, resRes] = await Promise.all([
        fetch("/api/slots?all=true"),
        fetch("/api/reservations"),
      ]);
      const slotsData = await slotsRes.json();
      const resData = await resRes.json();
      setSlots(slotsData);
      setReservations(resData);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setLoadingSlots(true);
    fetchData();
  };

  async function handleCheckIn(reservationId: string) {
    setProcessing(true);
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (res.ok) {
        setCheckResult({ success: true, message: `Welcome, ${data.studentName}!`, reservation: data });
        fetchData();
      } else {
        setCheckResult({ success: false, message: data.error || "Check-in failed." });
      }
    } catch {
      setCheckResult({ success: false, message: "Network error." });
    } finally {
      setProcessing(false);
    }
  }

  function handleQRScan(raw: string) {
    setScanning(false);
    try {
      const parsed = JSON.parse(raw);
      if (parsed.id) handleCheckIn(parsed.id);
      else setCheckResult({ success: false, message: "Invalid QR code format." });
    } catch {
      // Maybe raw is just the ID
      handleCheckIn(raw.trim());
    }
  }

  function handleManualCheckIn() {
    const code = manualCode.trim().toUpperCase();
    if (!code) {
      setCheckResult({ success: false, message: "Please enter a reservation code." });
      return;
    }
    if (code.length < 3) {
      setCheckResult({ success: false, message: "Reservation code must be at least 3 characters." });
      return;
    }
    handleCheckIn(code);
    setManualCode("");
  }

  async function handleCreateSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!newStart.trim() || !newEnd.trim() || newCapacity <= 0) {
      setSlotFeedback({ text: "Please enter valid start time, end time, and capacity.", error: true });
      return;
    }
    setSlotActionLoading(true);
    try {
      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meal: newMeal,
          startTime: newStart.trim(),
          endTime: newEnd.trim(),
          capacity: Number(newCapacity),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSlotFeedback({ text: data.error || "Failed to create slot", error: true });
      } else {
        setSlotFeedback({ text: `Slot created successfully for ${MEAL_LABEL[newMeal]}!`, error: false });
        setNewStart("");
        setNewEnd("");
        await fetchData();
      }
    } catch {
      setSlotFeedback({ text: "Network error creating slot", error: true });
    } finally {
      setSlotActionLoading(false);
    }
  }

  async function handleToggleDisable(slotId: string, currentDisabled?: boolean) {
    setSlotActionLoading(true);
    try {
      const res = await fetch(`/api/slots/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !currentDisabled }),
      });
      if (res.ok) {
        setSlotFeedback({ text: `Slot status updated (${!currentDisabled ? "Disabled" : "Enabled"}).`, error: false });
        await fetchData();
      }
    } catch {
      setSlotFeedback({ text: "Failed to update slot status", error: true });
    } finally {
      setSlotActionLoading(false);
    }
  }

  async function handleUpdateCapacity(slotId: string, newCap: number) {
    if (newCap <= 0) return;
    try {
      const res = await fetch(`/api/slots/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity: newCap }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // silent
    }
  }

  async function handleDeleteSlot(slotId: string) {
    if (!confirm("Are you sure you want to delete this time slot?")) return;
    try {
      const res = await fetch(`/api/slots/${slotId}`, { method: "DELETE" });
      if (res.ok) {
        setSlotFeedback({ text: "Slot deleted successfully.", error: false });
        await fetchData();
      }
    } catch {
      setSlotFeedback({ text: "Failed to delete slot", error: true });
    }
  }

  const activeCount = reservations.filter((r) => r.status === "active").length;
  const checkedInCount = reservations.filter((r) => r.status === "checked-in").length;
  const totalBooked = slots.reduce((s, slot) => s + slot.booked, 0);

  const tabStyle = (tab: "overview" | "checkin" | "slots") => ({
    padding: "0.5rem 1.25rem",
    borderRadius: "0.625rem",
    fontWeight: 600,
    fontSize: "0.875rem",
    cursor: "pointer",
    border: activeTab === tab ? "1px solid rgba(99,102,241,0.45)" : "1px solid transparent",
    background: activeTab === tab ? "rgba(99,102,241,0.22)" : "transparent",
    color: activeTab === tab ? "white" : "rgba(255,255,255,0.5)",
    transition: "all 0.2s ease",
  });

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {scanning && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setScanning(false)}
        />
      )}

      <main
        style={{
          flex: 1,
          maxWidth: 900,
          margin: "0 auto",
          width: "100%",
          padding: "2rem 1.25rem 4rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
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
              Staff Panel
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", marginTop: "0.3rem" }}>
              Monitor slots and check in students
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={handleRefresh}
            id="refresh-btn"
            style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.875rem" }}>
          {[
            { label: "Total Booked", value: totalBooked, icon: Users, color: "#818cf8" },
            { label: "Active", value: activeCount, icon: BarChart3, color: "#34d399" },
            { label: "Checked In", value: checkedInCount, icon: CheckCircle2, color: "#6366f1" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <Icon size={18} color={color} />
              <p style={{ fontWeight: 800, fontSize: "1.75rem", color: "white", margin: 0, lineHeight: 1 }}>
                {value}
              </p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.375rem" }}>
          <button onClick={() => setActiveTab("overview")} style={tabStyle("overview")} id="tab-overview">
            <BarChart3 size={13} style={{ display: "inline", marginRight: "0.35rem" }} />
            Slot Overview
          </button>
          <button onClick={() => setActiveTab("checkin")} style={tabStyle("checkin")} id="tab-checkin">
            <Camera size={13} style={{ display: "inline", marginRight: "0.35rem" }} />
            Check-in
          </button>
          <button onClick={() => setActiveTab("slots")} style={tabStyle("slots")} id="tab-slots">
            <Sliders size={13} style={{ display: "inline", marginRight: "0.35rem" }} />
            Slot Management
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="glass animate-fade-up" style={{ padding: "1.75rem" }}>
            {loadingSlots ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <Loader2 size={28} color="#818cf8" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : (
              <SlotOccupancyBar slots={slots} />
            )}
          </div>
        )}

        {/* Check-in Tab */}
        {activeTab === "checkin" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }} className="animate-fade-up">
            {/* QR Scan + Manual */}
            <div className="glass" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "rgba(255,255,255,0.85)", margin: 0 }}>
                Check-in Student
              </h2>

              {/* Scan button */}
              <button
                className="btn-primary"
                onClick={() => { setCheckResult(null); setScanning(true); }}
                id="open-scanner-btn"
                style={{ alignSelf: "flex-start" }}
              >
                <Camera size={16} />
                Scan QR Code
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}>or enter manually</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              </div>

              {/* Manual entry */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <input
                  id="manual-code-input"
                  type="text"
                  placeholder="Enter 6-char code or ID (e.g. RES001)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleManualCheckIn(); }}
                  style={{
                    flex: 1,
                    padding: "0.75rem 1rem",
                    borderRadius: "0.875rem",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "white",
                    fontSize: "0.9375rem",
                    outline: "none",
                    fontFamily: "monospace",
                    letterSpacing: "0.05em",
                  }}
                />
                <button
                  className="btn-primary"
                  onClick={handleManualCheckIn}
                  disabled={!manualCode.trim() || processing}
                  id="manual-checkin-btn"
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  {processing ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={16} />}
                </button>
              </div>

              {/* Result */}
              {checkResult && (
                <div
                  className="animate-fade-up"
                  style={{
                    padding: "1.25rem",
                    borderRadius: "1rem",
                    background: checkResult.success
                      ? "rgba(16,185,129,0.15)"
                      : "rgba(244,63,94,0.15)",
                    border: `1px solid ${checkResult.success ? "rgba(16,185,129,0.35)" : "rgba(244,63,94,0.35)"}`,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.875rem",
                  }}
                >
                  {checkResult.success ? (
                    <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0 }} />
                  ) : (
                    <XCircle size={24} color="#f43f5e" style={{ flexShrink: 0 }} />
                  )}
                  <div>
                    <p style={{ fontWeight: 700, color: "white", margin: 0 }}>
                      {checkResult.success ? "Check-in Successful!" : "Check-in Failed"}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                      {checkResult.message}
                    </p>
                    {checkResult.reservation && (
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8125rem", marginTop: "0.375rem" }}>
                        {MEAL_LABEL[checkResult.reservation.meal]} ·{" "}
                        {checkResult.reservation.startTime} – {checkResult.reservation.endTime} ·{" "}
                        {checkResult.reservation.studentId}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recent reservations list */}
            <div className="glass" style={{ padding: "1.75rem" }}>
              <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "rgba(255,255,255,0.85)", margin: "0 0 1rem" }}>
                Recent Reservations
              </h2>
              {reservations.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", textAlign: "center", padding: "1.5rem 0" }}>
                  No reservations yet
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 320, overflowY: "auto" }}>
                  {[...reservations].reverse().map((res) => (
                    <div
                      key={res.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.75rem",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, color: "white", margin: 0, fontSize: "0.875rem" }}>
                          {res.studentName}
                          <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400, marginLeft: "0.4rem", fontSize: "0.8rem" }}>
                            ({res.studentId})
                          </span>
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", margin: "0.15rem 0 0", fontFamily: "monospace" }}>
                          {res.id} · {MEAL_LABEL[res.meal]} · {res.startTime}–{res.endTime}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <span
                          className={
                            res.status === "checked-in"
                              ? "badge badge-checked"
                              : res.status === "cancelled"
                              ? "badge badge-full"
                              : "badge badge-active"
                          }
                        >
                          {res.status === "checked-in"
                            ? "Checked In"
                            : res.status === "cancelled"
                            ? "Cancelled"
                            : "Active"}
                        </span>
                        {res.status === "active" && (
                          <button
                            id={`checkin-btn-${res.id}`}
                            onClick={() => handleCheckIn(res.id)}
                            disabled={processing}
                            style={{
                              padding: "0.3rem 0.75rem",
                              borderRadius: "0.5rem",
                              background: "rgba(99,102,241,0.25)",
                              border: "1px solid rgba(99,102,241,0.4)",
                              color: "#a5b4fc",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              cursor: processing ? "not-allowed" : "pointer",
                            }}
                          >
                            Check In
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Slot Management Tab */}
        {activeTab === "slots" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} className="animate-fade-up">
            {/* Create New Slot Card */}
            <div className="glass" style={{ padding: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Plus size={18} color="#818cf8" />
                <h2 style={{ fontWeight: 700, fontSize: "1.125rem", color: "white", margin: 0 }}>
                  Create New Time Slot
                </h2>
              </div>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", margin: "0 0 1.25rem" }}>
                Add new dining slots dynamically without code changes.
              </p>

              <form onSubmit={handleCreateSlot} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.875rem", alignItems: "end" }}>
                <div>
                  <label htmlFor="slot-meal-select" style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem" }}>Meal</label>
                  <select
                    id="slot-meal-select"
                    value={newMeal}
                    onChange={(e) => setNewMeal(e.target.value as Meal)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "0.625rem",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="breakfast" style={{ background: "#1e1b4b" }}>Breakfast</option>
                    <option value="lunch" style={{ background: "#1e1b4b" }}>Lunch</option>
                    <option value="dinner" style={{ background: "#1e1b4b" }}>Dinner</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="slot-start-time" style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem" }}>Start Time</label>
                  <input
                    id="slot-start-time"
                    type="time"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "0.625rem",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="slot-end-time" style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem" }}>End Time</label>
                  <input
                    id="slot-end-time"
                    type="time"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "0.625rem",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="slot-capacity" style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem" }}>Capacity</label>
                  <input
                    id="slot-capacity"
                    type="number"
                    min="1"
                    max="500"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    required
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "0.625rem",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={slotActionLoading}
                  className="btn-primary"
                  id="add-slot-submit-btn"
                  style={{ padding: "0.6rem 1rem", fontSize: "0.875rem", height: "fit-content" }}
                >
                  <Plus size={15} />
                  Add Slot
                </button>
              </form>

              {slotFeedback && (
                <p
                  style={{
                    color: slotFeedback.error ? "#fda4af" : "#6ee7b7",
                    fontSize: "0.8125rem",
                    marginTop: "0.75rem",
                    marginBottom: 0,
                  }}
                >
                  {slotFeedback.text}
                </p>
              )}
            </div>

            {/* Existing Slots List & Capacity Controls */}
            <div className="glass" style={{ padding: "1.75rem" }}>
              <h2 style={{ fontWeight: 700, fontSize: "1.125rem", color: "white", margin: "0 0 1rem" }}>
                Current Slots & Capacity Controls
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {(["breakfast", "lunch", "dinner"] as Meal[]).map((mealKey) => {
                  const mealSlots = slots.filter((s) => s.meal === mealKey);
                  return (
                    <div key={mealKey}>
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: "0.5rem" }}>
                        {MEAL_LABEL[mealKey]} ({mealSlots.length} slots)
                      </h3>

                      {mealSlots.length === 0 ? (
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem", margin: "0.25rem 0" }}>
                          No slots configured for this meal.
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {mealSlots.map((slot) => {
                            const isDisabled = Boolean(slot.disabled);
                            return (
                              <div
                                key={slot.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "0.75rem 1rem",
                                  borderRadius: "0.75rem",
                                  background: isDisabled ? "rgba(244,63,94,0.06)" : "rgba(255,255,255,0.04)",
                                  border: isDisabled ? "1px solid rgba(244,63,94,0.25)" : "1px solid rgba(255,255,255,0.08)",
                                  flexWrap: "wrap",
                                  gap: "0.75rem",
                                }}
                              >
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "white" }}>
                                      {slot.startTime} – {slot.endTime}
                                    </span>
                                    <span className={isDisabled ? "badge badge-full" : "badge badge-active"}>
                                      {isDisabled ? "Disabled" : "Active"}
                                    </span>
                                  </div>
                                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", margin: "0.2rem 0 0" }}>
                                    {slot.booked} / {slot.capacity} booked &nbsp;·&nbsp; ID: {slot.id}
                                  </p>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                                  {/* Capacity Adjusters */}
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                    <label htmlFor={`cap-${slot.id}`} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>Cap:</label>
                                    <input
                                      id={`cap-${slot.id}`}
                                      type="number"
                                      min="1"
                                      max="500"
                                      defaultValue={slot.capacity}
                                      onBlur={(e) => handleUpdateCapacity(slot.id, Number(e.target.value))}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          (e.target as HTMLInputElement).blur();
                                        }
                                      }}
                                      style={{
                                        width: 55,
                                        padding: "0.25rem 0.4rem",
                                        borderRadius: "0.375rem",
                                        background: "rgba(255,255,255,0.08)",
                                        border: "1px solid rgba(255,255,255,0.15)",
                                        color: "white",
                                        fontSize: "0.8125rem",
                                        textAlign: "center",
                                      }}
                                    />
                                  </div>

                                  {/* Toggle Disable Button */}
                                  <button
                                    id={`toggle-disable-${slot.id}`}
                                    onClick={() => handleToggleDisable(slot.id, slot.disabled)}
                                    title={isDisabled ? "Enable slot" : "Disable slot"}
                                    style={{
                                      padding: "0.35rem 0.65rem",
                                      borderRadius: "0.5rem",
                                      background: isDisabled ? "rgba(16,185,129,0.18)" : "rgba(244,63,94,0.15)",
                                      border: isDisabled ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(244,63,94,0.3)",
                                      color: isDisabled ? "#6ee7b7" : "#fda4af",
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.3rem",
                                    }}
                                  >
                                    <Power size={12} />
                                    {isDisabled ? "Enable" : "Disable"}
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    id={`delete-slot-${slot.id}`}
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    title="Delete slot"
                                    style={{
                                      padding: "0.35rem 0.5rem",
                                      borderRadius: "0.5rem",
                                      background: "rgba(255,255,255,0.06)",
                                      border: "1px solid rgba(255,255,255,0.12)",
                                      color: "rgba(255,255,255,0.5)",
                                      fontSize: "0.75rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
