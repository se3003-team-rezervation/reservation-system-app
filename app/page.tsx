"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import MealCard from "@/components/MealCard";
import { Meal } from "@/lib/types";
import { ArrowRight, Sparkles } from "lucide-react";

const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];

export default function HomePage() {
  const router = useRouter();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");

  function handleContinue() {
    if (!studentName.trim()) { setError("Please enter your name."); return; }
    if (!studentId.trim()) { setError("Please enter your Student ID."); return; }
    if (!selectedMeal) { setError("Please select a meal."); return; }
    setError("");
    router.push(
      `/reserve?meal=${selectedMeal}&name=${encodeURIComponent(studentName.trim())}&sid=${encodeURIComponent(studentId.trim())}`
    );
  }

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "0.875rem",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "white",
    fontSize: "0.9375rem",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "2rem 1.25rem 4rem",
          maxWidth: 680,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }} className="animate-fade-up">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.375rem 1rem",
              borderRadius: 9999,
              background: "rgba(99,102,241,0.2)",
              border: "1px solid rgba(99,102,241,0.35)",
              color: "#a5b4fc",
              fontSize: "0.8125rem",
              fontWeight: 600,
              marginBottom: "1.25rem",
            }}
          >
            <Sparkles size={13} />
            Skip the queue · Reserve your seat
          </div>
          <h1
            style={{
              fontWeight: 800,
              fontSize: "clamp(1.875rem, 5vw, 2.75rem)",
              lineHeight: 1.15,
              color: "white",
              margin: 0,
              letterSpacing: "-0.03em",
            }}
          >
            Book Your Cafeteria
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #818cf8, #6366f1, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Time Slot
            </span>
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "1rem",
              marginTop: "0.875rem",
            }}
          >
            Reserve a slot, get your QR code, and walk in hassle-free.
          </p>
        </div>

        {/* Form card */}
        <div
          className="glass animate-fade-up"
          style={{ width: "100%", padding: "2rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Student info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "rgba(255,255,255,0.85)", margin: 0 }}>
              Your Details
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label
                  htmlFor="student-name"
                  style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)", display: "block", marginBottom: "0.375rem" }}
                >
                  Full Name
                </label>
                <input
                  id="student-name"
                  type="text"
                  placeholder="e.g. Ali Kaya"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  htmlFor="student-id"
                  style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)", display: "block", marginBottom: "0.375rem" }}
                >
                  Student ID
                </label>
                <input
                  id="student-id"
                  type="text"
                  placeholder="e.g. S202312345"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Meal selection */}
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "rgba(255,255,255,0.85)", margin: "0 0 0.875rem" }}>
              Select Meal
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.75rem",
              }}
            >
              {MEALS.map((m) => (
                <MealCard
                  key={m}
                  meal={m}
                  selected={selectedMeal === m}
                  onClick={() => setSelectedMeal(m)}
                />
              ))}
            </div>
          </div>

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

          <button
            className="btn-primary"
            onClick={handleContinue}
            id="continue-to-slots"
            style={{ alignSelf: "flex-end" }}
          >
            Choose Time Slot
            <ArrowRight size={16} />
          </button>
        </div>
      </main>
    </div>
  );
}
