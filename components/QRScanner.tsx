"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Html5QrcodeInstance = any;

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeInstance>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let localScanner: Html5QrcodeInstance = null;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const id = "qr-scanner-region";
        localScanner = new Html5Qrcode(id);
        scannerRef.current = localScanner;

        await localScanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            onScan(decodedText);
          },
          undefined
        );
        setLoading(false);
      } catch (err) {
        setError("Camera not available or permission denied.");
        setLoading(false);
        console.error(err);
      }
    }

    startScanner();

    return () => {
      if (localScanner) {
        localScanner.stop().catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "1.5rem",
          padding: "1.75rem",
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Camera size={20} color="#818cf8" />
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "white" }}>
              Scan QR Code
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close scanner"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "0.625rem",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "white",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {loading && (
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", textAlign: "center" }}>
            Initializing camera…
          </p>
        )}
        {error && (
          <p style={{ color: "#fda4af", fontSize: "0.875rem", textAlign: "center" }}>{error}</p>
        )}

        {/* Scanner viewport */}
        <div
          id="qr-scanner-region"
          style={{ borderRadius: "1rem", overflow: "hidden", minHeight: 260 }}
        />

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8125rem", textAlign: "center" }}>
          Position the student&apos;s QR code in the frame
        </p>
      </div>
    </div>
  );
}
