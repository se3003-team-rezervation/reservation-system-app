"use client";
import Link from "next/link";
import { UtensilsCrossed, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        gap: "1.5rem",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "1.5rem",
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 12px 40px rgba(99,102,241,0.45)",
          fontSize: "2.5rem",
        }}
      >
        🍽️
      </div>

      {/* 404 */}
      <div>
        <p
          style={{
            fontSize: "6rem",
            fontWeight: 800,
            lineHeight: 1,
            margin: 0,
            background: "linear-gradient(135deg, #818cf8, #6366f1, #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.04em",
          }}
        >
          404
        </p>
        <h1
          style={{
            fontWeight: 700,
            fontSize: "1.375rem",
            color: "white",
            margin: "0.5rem 0 0",
          }}
        >
          Page Not Found
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.9375rem",
            marginTop: "0.5rem",
            maxWidth: 320,
          }}
        >
          Looks like this table doesn&apos;t exist. Head back and make your reservation.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          id="not-found-home-btn"
          className="btn-primary"
          style={{ textDecoration: "none" }}
        >
          <Home size={15} />
          Go Home
        </Link>
        <button
          onClick={() => history.back()}
          className="btn-secondary"
          id="not-found-back-btn"
        >
          <ArrowLeft size={15} />
          Go Back
        </button>
      </div>

      {/* Logo watermark */}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          opacity: 0.3,
        }}
      >
        <UtensilsCrossed size={14} color="white" />
        <span style={{ color: "white", fontSize: "0.8125rem", fontWeight: 600 }}>DormDine</span>
      </div>
    </div>
  );
}
