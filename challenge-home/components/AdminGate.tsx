"use client";

import { useEffect, useState } from "react";
import { verifyPin, hasValidSession, startSession, clearSession } from "@/lib/adminAuth";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthed(hasValidSession());
    setChecking(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ok = await verifyPin(pin.trim());
    if (ok) {
      startSession();
      setAuthed(true);
    } else {
      setError("PIN incorrecto.");
    }
  }

  if (checking) return null;

  if (!authed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--cream-50)",
          padding: 24,
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 20,
            padding: 32,
            width: "100%",
            maxWidth: 340,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              color: "var(--plum-950)",
              marginBottom: 6,
            }}
          >
            CHALLENGE — Admin
          </div>
          <p style={{ fontSize: 13, color: "rgba(36,19,34,0.6)", marginBottom: 20 }}>
            Ingresá el PIN para gestionar el catálogo.
          </p>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            style={{
              width: "100%",
              textAlign: "center",
              letterSpacing: 4,
              fontSize: 20,
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid var(--line)",
              marginBottom: 14,
            }}
          />
          {error && <div style={{ color: "#a3271e", fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <button
            type="submit"
            disabled={pin.length === 0}
            style={{
              width: "100%",
              background: "var(--coral-500)",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "12px 20px",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "12px 24px 0",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => {
            clearSession();
            setAuthed(false);
          }}
          style={{
            background: "none",
            border: "none",
            color: "rgba(36,19,34,0.5)",
            fontSize: 12,
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>
      {children}
    </div>
  );
}
