"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, CalendarCheck, ShieldCheck } from "lucide-react";

const navLinks = [
  { href: "/", label: "Reserve", icon: UtensilsCrossed, ariaLabel: "Make a reservation" },
  { href: "/my-reservations", label: "My Reservations", icon: CalendarCheck, ariaLabel: "View my reservations" },
  { href: "/staff", label: "Staff Panel", icon: ShieldCheck, ariaLabel: "Open staff panel" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
      role="banner"
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "4rem",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="DormDine – go to home"
          style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "0.75rem",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99,102,241,0.45)",
              flexShrink: 0,
            }}
          >
            <UtensilsCrossed size={18} color="white" />
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: "1.125rem",
              color: "white",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            DormDine
          </span>
        </Link>

        {/* Navigation */}
        <nav aria-label="Main navigation" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {navLinks.map(({ href, label, icon: Icon, ariaLabel }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-label={ariaLabel}
                aria-current={active ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.45rem 0.875rem",
                  borderRadius: "0.625rem",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 500,
                  textDecoration: "none",
                  color: active ? "white" : "rgba(255,255,255,0.6)",
                  background: active ? "rgba(99,102,241,0.25)" : "transparent",
                  border: active
                    ? "1px solid rgba(99,102,241,0.4)"
                    : "1px solid transparent",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={15} />
                <span
                  style={{
                    display: "none",
                  }}
                  className="sm:inline-block"
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
