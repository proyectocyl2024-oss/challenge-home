"use client";

import { useEffect, useState } from "react";
import { fetchSales, deleteSale, updateSale, type Sale, type PaymentMethod, type SaleChannel } from "@/lib/sales";
import { adjustProductStock } from "@/lib/products";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(
    value
  );

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  posnet: "Posnet",
};

const CHANNEL_LABELS: Record<SaleChannel, string> = {
  local: "Local",
  online: "Online",
  evento: "Evento",
  estudios: "Estudios",
};

export default function SalesHistory({ refreshKey }: { refreshKey?: number }) {
  const [open, setOpen] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPayment, setEditPayment] = useState<PaymentMethod>("efectivo");
  const [editChannel, setEditChannel] = useState<SaleChannel>("local");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSales();
      setSales(data);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) load();
  }, [open, refreshKey]);

  function startEdit(s: Sale) {
    setEditingId(s.id);
    setEditDate(s.date);
    setEditTime(s.time || "");
    setEditQty(String(s.quantity));
    setEditPrice(String(s.unitPrice));
    setEditPayment(s.paymentMethod);
    setEditChannel(s.channel ?? "local");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(s: Sale) {
    const newQty = Number(editQty) || 1;
    const newPrice = Number(editPrice) || 0;
    const newTotal = newQty * newPrice;

    try {
      await updateSale(s.id, {
        date: editDate,
        time: editTime,
        quantity: newQty,
        unitPrice: newPrice,
        total: newTotal,
        paymentMethod: editPayment,
        channel: editChannel,
      });

      // Si está vinculada a un producto del catálogo, ajustamos el stock
      // por la diferencia entre la cantidad vieja y la nueva.
      if (s.productId) {
        const delta = s.quantity - newQty; // si vendiste menos ahora, repone; si vendiste más, descuenta
        if (delta !== 0) {
          await adjustProductStock(s.productId, delta);
        }
      }

      setEditingId(null);
      await load();
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar el cambio.");
    }
  }

  async function handleDelete(s: Sale) {
    if (!confirm("¿Borrar esta venta? Si estaba vinculada a un producto del catálogo, se le repone el stock.")) {
      return;
    }
    try {
      await deleteSale(s.id);
      if (s.productId) {
        await adjustProductStock(s.productId, s.quantity);
      }
      await load();
    } catch (e) {
      console.error(e);
      setError("No se pudo borrar la venta.");
    }
  }

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
        {open ? "Ocultar historial de ventas" : "Ver historial de ventas"}
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
          ) : sales.length === 0 ? (
            <p style={{ fontSize: 13, color: "rgba(36,19,34,0.5)" }}>Todavía no hay ventas registradas.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sales.map((s) => (
                <div
                  key={s.id}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    background: "#fff",
                    fontSize: 13,
                  }}
                >
                  {editingId === s.id ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 0.8fr 1fr 1fr 1fr 1fr auto auto",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        style={editInputStyle}
                      />
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        style={editInputStyle}
                      />
                      <input
                        type="number"
                        min="1"
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                        style={editInputStyle}
                        placeholder="Cant."
                      />
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        style={editInputStyle}
                        placeholder="Precio"
                      />
                      <select
                        value={editPayment}
                        onChange={(e) => setEditPayment(e.target.value as PaymentMethod)}
                        style={editInputStyle}
                      >
                        {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editChannel}
                        onChange={(e) => setEditChannel(e.target.value as SaleChannel)}
                        style={editInputStyle}
                      >
                        {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => saveEdit(s)} style={saveBtn}>
                        Guardar
                      </button>
                      <button onClick={cancelEdit} style={cancelBtn}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 90, color: "rgba(36,19,34,0.5)" }}>
                        {s.date}
                        {s.time && <div style={{ fontSize: 11 }}>{s.time}</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong>{s.productName}</strong> · {s.quantity} u. × {formatARS(s.unitPrice)}
                      </div>
                      <div style={{ width: 100, color: "rgba(36,19,34,0.6)" }}>
                        {PAYMENT_LABELS[s.paymentMethod]}
                        <div style={{ fontSize: 11 }}>{CHANNEL_LABELS[s.channel ?? "local"]}</div>
                      </div>
                      <div style={{ width: 90, fontWeight: 600, textAlign: "right" }}>
                        {formatARS(s.total)}
                      </div>
                      <button onClick={() => startEdit(s)} style={editBtn}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(s)} style={deleteBtn}>
                        Borrar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const editInputStyle: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  fontSize: 12,
};

const saveBtn: React.CSSProperties = {
  background: "var(--coral-500)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 600,
};

const cancelBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
};

const editBtn: React.CSSProperties = {
  border: "1px solid var(--plum-800)",
  color: "var(--plum-800)",
  background: "transparent",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 600,
};

const deleteBtn: React.CSSProperties = {
  border: "1px solid #a3271e",
  color: "#a3271e",
  background: "transparent",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 600,
};
