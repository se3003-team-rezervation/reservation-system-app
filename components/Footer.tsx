import { UtensilsCrossed, Github } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "1.5rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        maxWidth: 1100,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "0.5rem",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UtensilsCrossed size={13} color="white" />
        </div>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8125rem" }}>
          © {year} DormDine — SE3003 Group Project
        </span>
      </div>

      <a
        href="https://github.com/se3003-team-rezervation/reservation-system-app"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          color: "rgba(255,255,255,0.3)",
          fontSize: "0.8125rem",
          textDecoration: "none",
          transition: "color 0.2s ease",
        }}
        aria-label="View source on GitHub"
      >
        <Github size={14} />
        View on GitHub
      </a>
    </footer>
  );
}
