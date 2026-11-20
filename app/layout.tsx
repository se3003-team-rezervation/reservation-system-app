import type { Metadata, Viewport } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "DormDine – Cafeteria Reservation",
  description:
    "Reserve your meal slot at the university cafeteria, skip the queue, and get a QR check-in code.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
        <ServiceWorkerRegister />
        <div style={{ flex: 1 }}>{children}</div>
        <Footer />
      </body>
    </html>
  );
}
