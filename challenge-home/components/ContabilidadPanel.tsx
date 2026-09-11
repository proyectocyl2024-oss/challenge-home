"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSales, updateSale, deleteSale, type Sale, type PaymentMethod, type SaleChannel } from "@/lib/sales";
import { adjustProductStock } from "@/lib/products";
import InternalNav from "./InternalNav";

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

const CHANNEL_LABELS: Record<SaleChannel, string> = {
  local: "Venta en local",
  online: "Venta online",
  evento: "Venta en evento",
  estudios: "Venta a estudios",
};

type Filter = "hoy" | "semana" | "mes" | "todo";

export default function ContabilidadPanel() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("mes");

  // --- Edición de ventas en el historial ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPayment, setEditPayment] = useState<PaymentMethod>("efectivo");
  const [editChannel, setEditChannel] = useState<SaleChannel>("local");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await fetchSales();
      setSales(data);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las ventas. Revisá la configuración de Firebase.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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

  const byChannel = useMemo(() => {
    const map = new Map<SaleChannel, number>();
    for (const s of filtered) {
      const ch = s.channel ?? "local";
      map.set(ch, (map.get(ch) ?? 0) + s.total);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const grandTotal = filtered.reduce((sum, s) => sum + s.total, 0);
  const totalUnits = filtered.reduce((sum, s) => sum + s.quantity, 0);

  function startEdit(s: Sale) {
    setEditingId(s.id);
    setEditQty(String(s.quantity));
    setEditPrice(String(s.unitPrice));
    setEditPayment(s.paymentMethod);
    setEditChannel(s.channel ?? "local");
    setEditDate(s.date);
    setEditTime(s.time || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(sale: Sale) {
    const newQty = Number(editQty) || 1;
    const newPrice = Number(editPrice) || 0;
    setSaving(true);
    setError(null);
    try {
      await updateSale(sale.id, {
        date: editDate,
        time: editTime,
        quantity: newQty,
        unitPrice: newPrice,
        total: newQty * newPrice,
        paymentMethod: editPayment,
        channel: editChannel,
      });
      // Ajustar stock por la diferencia, si la venta está vinculada a un producto del catálogo
      if (sale.productId) {
        const delta = sale.quantity - newQty; // si vendiste menos ahora, repone; si vendiste más, descuenta más
        if (delta !== 0) {
          await adjustProductStock(sale.productId, delta);
        }
      }
      setEditingId(null);
      await load();
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar el cambio.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSale(sale: Sale) {
    if (!confirm("¿Borrar esta venta? Si estaba vinculada a un producto, se le repone el stock.")) return;
    setError(null);
    try {
      await deleteSale(sale.id);
      if (sale.productId) {
        await adjustProductStock(sale.productId, sale.quantity);
      }
      await load();
    } catch (e) {
      console.error(e);
      setError("No se pudo borrar la venta.");
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Cargando...</div>;
  }

  return (
    <>
      <InternalNav current="contabilidad" />
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
        <div style={{ marginBottom: 32 }}>
          {byPayment.map(([method, amount]) => (
            <div key={method} style={rowStyle}>
              <div style={{ flex: 1 }}>{PAYMENT_LABELS[method]}</div>
              <div style={{ fontWeight: 600 }}>{formatARS(amount)}</div>
            </div>
          ))}
        </div>
      )}

      <h2 style={sectionTitle}>Por canal de venta</h2>
      {byChannel.length === 0 ? (
        <p style={{ color: "rgba(36,19,34,0.5)", fontSize: 14, marginBottom: 32 }}>
          Sin datos en este período.
        </p>
      ) : (
        <div style={{ marginBottom: 32 }}>
          {byChannel.map(([ch, amount]) => (
            <div key={ch} style={rowStyle}>
              <div style={{ flex: 1 }}>{CHANNEL_LABELS[ch]}</div>
              <div style={{ fontWeight: 600 }}>{formatARS(amount)}</div>
            </div>
          ))}
        </div>
      )}

      <h2 style={sectionTitle}>Historial de ventas</h2>
      {filtered.length === 0 ? (
        <p style={{ color: "rgba(36,19,34,0.5)", fontSize: 14 }}>Sin ventas en este período.</p>
      ) : (
        <div>
          {filtered.map((s) =>
            editingId === s.id ? (
              <div
                key={s.id}
                style={{
                  border: "2px solid var(--coral-500)",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                  background: "#fff",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: 10,
                }}
              >
                <div style={{ gridColumn: "1 / -1", fontSize: 13, fontWeight: 600 }}>
                  Editando: {s.productName}
                </div>
                <div>
                  <label style={editLabel}>Fecha</label>
                  <input style={editInput} type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                <div>
                  <label style={editLabel}>Hora</label>
                  <input style={editInput} type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
                </div>
                <div>
                  <label style={editLabel}>Cantidad</label>
                  <input style={editInput} type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
                </div>
                <div>
                  <label style={editLabel}>Precio unitario</label>
                  <input style={editInput} type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                </div>
                <div>
                  <label style={editLabel}>Forma de pago</label>
                  <select
                    style={editInput}
                    value={editPayment}
                    onChange={(e) => setEditPayment(e.target.value as PaymentMethod)}
                  >
                    {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={editLabel}>Canal</label>
                  <select
                    style={editInput}
                    value={editChannel}
                    onChange={(e) => setEditChannel(e.target.value as SaleChannel)}
                  >
                    {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, marginTop: 4 }}>
                  <button
                    onClick={() => saveEdit(s)}
                    disabled={saving}
                    style={{
                      background: "var(--coral-500)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 999,
                      padding: "8px 18px",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--plum-800)",
                      color: "var(--plum-800)",
                      borderRadius: 999,
                      padding: "8px 18px",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div key={s.id} style={rowStyle}>
                <div style={{ width: 90, color: "rgba(36,19,34,0.5)" }}>
                  {s.date}
                  {s.time && <div style={{ fontSize: 11 }}>{s.time}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  {s.productName} · {s.quantity} u. × {formatARS(s.unitPrice)}
                </div>
                <div style={{ width: 100, color: "rgba(36,19,34,0.6)" }}>
                  {PAYMENT_LABELS[s.paymentMethod]}
                  <div style={{ fontSize: 11 }}>{CHANNEL_LABELS[s.channel ?? "local"]}</div>
                </div>
                <div style={{ width: 90, fontWeight: 600, textAlign: "right" }}>{formatARS(s.total)}</div>
                <button
                  onClick={() => startEdit(s)}
                  style={{
                    border: "1px solid var(--plum-800)",
                    color: "var(--plum-800)",
                    background: "transparent",
                    borderRadius: 999,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteSale(s)}
                  style={{
                    border: "1px solid #a3271e",
                    color: "#a3271e",
                    background: "transparent",
                    borderRadius: 999,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Borrar
                </button>
              </div>
            )
          )}
        </div>
      )}
      </div>
    </>
  );
}

const editLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--plum-800)",
  marginBottom: 4,
};

const editInput: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  fontSize: 13,
};

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
