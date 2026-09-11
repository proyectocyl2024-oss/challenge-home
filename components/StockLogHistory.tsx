"use client";

import { useEffect, useState } from "react";
import { fetchStockLog, type StockLogRecord } from "@/lib/stockLog";

export default function StockLogHistory() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<StockLogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetchStockLog()
      .then(setEntries)
      .catch((e) => {
        console.error(e);
        setError("No se pudo cargar el historial de stock.");
      })
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <div style={{ marginTop: 32 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "transparent",
          border: "1px solid var(--plum-800)",
          color: "var(--plum-800)",
          borderRadius: 999,
          padding: "8px 18px",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {open ? "Ocultar historial de cambios de stock" : "Ver historial de cambios de stock"}
      </button>

      {open && (
        <div style={{ marginTop: 16 }}>
          {error && (
            <div
              style={{
                background: "#fdeceb",
                color: "#a3271e",
                padding: "10px 14px",
                borderRadius: 10,
                marginBottom: 12,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          {loading ? (
            <p style={{ fontSize: 13, color: "rgba(36,19,34,0.5)" }}>Cargando...</p>
          ) : entries.length === 0 ? (
            <p style={{ fontSize: 13, color: "rgba(36,19,34,0.5)" }}>
              Todavía no hay cambios de stock registrados.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {entries.map((e) => (
                <div
                  key={e.id}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    background: "#fff",
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <strong>{e.productName}</strong>
                    <span style={{ color: "rgba(36,19,34,0.5)", fontSize: 12 }}>{e.createdAt}</span>
                  </div>
                  <div style={{ color: "rgba(36,19,34,0.7)" }}>
                    Stock: {e.previousStock} → {e.newStock} · Motivo: {e.motivo} · Firma: {e.firma}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
