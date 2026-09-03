"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSales, type Sale, type PaymentMethod } from "@/lib/sales";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(
    value
  );

const todayISO = () => new Date().toISOString().slice(0, 10);

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  posnet: "Posnet",
};

type Filter = "hoy" | "semana" | "mes" | "todo";

export default function ContabilidadPanel() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("mes");

  useEffect(() => {
    fetchSales()
      .then(setSales)
      .catch((e) => {
        console.error(e);
        setError("No se pudieron cargar las ventas. Revisá la configuración de Firebase.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "todo") return sales;
    const now = new Date();
    return sales.filter((s) => {
      const d = new Date(s.date + "T00:00:00");
      if (filter === "hoy") return s.date === todayISO();
      if (filter === "semana") {
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays < 7;
      }
      if (filter === "mes") {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      return true;
    });
  }, [sales, filter]);

  const byProduct = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; total: number }>();
    for (const s of filtered) {
      const key = s.productId ?? s.productName;
      const entry = map.get(key) ?? { name: s.productName, quantity: 0, total: 0 };
      entry.quantity += s.quantity;
      entry.total += s.total;
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const byPayment = useMemo(() => {
    const map = new Map<PaymentMethod, number>();
    for (const s of filtered) {
      map.set(s.paymentMethod, (map.get(s.paymentMethod) ?? 0) + s.total);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const grandTotal = filtered.reduce((sum, s) => sum + s.total, 0);
  const totalUnits = filtered.reduce((sum, s) => sum + s.quantity, 0);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Cargando...</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", fontFamily: "var(--font-body)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--plum-950)" }}>
        Contabilidad — CHALLENGE
      </h1>
      <p style={{ color: "rgba(36,19,34,0.6)", fontSize: 13, marginBottom: 24 }}>
        Totales calculados a partir de lo cargado en /ventas.
      </p>

      {error && (
        <div
          style={{
            background: "#fdeceb",
            color: "#a3271e",
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["hoy", "semana", "mes", "todo"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              border: "1px solid var(--plum-800)",
              borderRadius: 999,
              padding: "7px 16px",
              fontWeight: 600,
              fontSize: 13,
              background: filter === f ? "var(--plum-800)" : "transparent",
              color: filter === f ? "#fff" : "var(--plum-800)",
            }}
          >
            {f === "hoy" ? "Hoy" : f === "semana" ? "7 días" : f === "mes" ? "Este mes" : "Todo"}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div style={cardStyle}>
          <div style={cardLabel}>Total vendido</div>
          <div style={cardValue}>{formatARS(grandTotal)}</div>
        </div>
        <div style={cardStyle}>
          <div style={cardLabel}>Unidades vendidas</div>
          <div style={cardValue}>{totalUnits}</div>
        </div>
      </div>

      <h2 style={sectionTitle}>Total vendido por producto</h2>
      {byProduct.length === 0 ? (
        <p style={{ color: "rgba(36,19,34,0.5)", fontSize: 14, marginBottom: 32 }}>
          No hay ventas registradas en este período.
        </p>
      ) : (
        <div style={{ marginBottom: 32 }}>
          {byProduct.map((p) => (
            <div key={p.name} style={rowStyle}>
              <div style={{ flex: 1 }}>{p.name}</div>
              <div style={{ width: 90, color: "rgba(36,19,34,0.6)", textAlign: "right" }}>
                {p.quantity} u.
              </div>
              <div style={{ width: 110, fontWeight: 600, textAlign: "right" }}>
                {formatARS(p.total)}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={sectionTitle}>Por medio de pago</h2>
      {byPayment.length === 0 ? (
        <p style={{ color: "rgba(36,19,34,0.5)", fontSize: 14 }}>Sin datos en este período.</p>
      ) : (
        <div>
          {byPayment.map(([method, amount]) => (
            <div key={method} style={rowStyle}>
              <div style={{ flex: 1 }}>{PAYMENT_LABELS[method]}</div>
              <div style={{ fontWeight: 600 }}>{formatARS(amount)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--cream-100)",
  border: "1px solid var(--line)",
  borderRadius: 16,
  padding: "18px 20px",
};

const cardLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--plum-800)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 6,
};

const cardValue: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 26,
  color: "var(--plum-950)",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 20,
  color: "var(--plum-950)",
  marginBottom: 14,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  border: "1px solid var(--line)",
  borderRadius: 12,
  padding: "10px 14px",
  marginBottom: 8,
  background: "#fff",
  fontSize: 14,
};
