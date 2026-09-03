"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSales, createSale, deleteSale, type Sale, type PaymentMethod } from "@/lib/sales";
import { fetchProducts, adjustProductStock } from "@/lib/products";
import type { Product } from "@/data/products";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(
    value
  );

const todayISO = () => new Date().toISOString().slice(0, 10);

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  "mercado-pago": "Mercado Pago",
  tarjeta: "Tarjeta",
  otro: "Otro",
};

type Filter = "hoy" | "semana" | "mes" | "todo";

export default function SalesPanel() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("mes");

  const [date, setDate] = useState(todayISO());
  const [productName, setProductName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [salesData, productsData] = await Promise.all([fetchSales(), fetchProducts()]);
      setSales(salesData);
      setProducts(productsData);
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

  function handleProductSelect(name: string) {
    setProductName(name);
    const match = products.find((p) => p.name === name);
    if (match) {
      setUnitPrice(String(match.price));
      setSelectedProductId(match.id);
    } else {
      setSelectedProductId(undefined);
    }
  }

  function resetForm() {
    setDate(todayISO());
    setProductName("");
    setSelectedProductId(undefined);
    setQuantity("1");
    setUnitPrice("");
    setPaymentMethod("efectivo");
    setNote("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity) || 1;
    const price = Number(unitPrice) || 0;
    if (!productName.trim() || price <= 0) {
      setError("Completá al menos producto y precio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createSale({
        date,
        productId: selectedProductId,
        productName: productName.trim(),
        quantity: qty,
        unitPrice: price,
        total: qty * price,
        paymentMethod,
        note: note.trim() || undefined,
      });
      if (selectedProductId) {
        await adjustProductStock(selectedProductId, -qty);
      }
      resetForm();
      await load();
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar la venta.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar esta venta? Si estaba vinculada a un producto del catálogo, se le repone el stock.")) return;
    try {
      const sale = sales.find((s) => s.id === id);
      await deleteSale(id);
      if (sale?.productId) {
        await adjustProductStock(sale.productId, sale.quantity);
      }
      await load();
    } catch (e) {
      console.error(e);
      setError("No se pudo borrar la venta.");
    }
  }

  const filtered = useMemo(() => {
    if (filter === "todo") return sales;
    const now = new Date();
    return sales.filter((s) => {
      const d = new Date(s.date + "T00:00:00");
      if (filter === "hoy") {
        return s.date === todayISO();
      }
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

  const total = filtered.reduce((sum, s) => sum + s.total, 0);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", fontFamily: "var(--font-body)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--plum-950)" }}>
        Registro de ventas — CHALLENGE
      </h1>
      <p style={{ color: "rgba(36,19,34,0.6)", fontSize: 13, marginBottom: 28 }}>
        Registro interno para llevar la cuenta de lo vendido. No genera factura oficial de AFIP.
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

      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--cream-100)",
          border: "1px solid var(--line)",
          borderRadius: 20,
          padding: 24,
          marginBottom: 32,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <div>
          <label style={labelStyle}>Fecha</label>
          <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>Medio de pago</label>
          <select
            style={inputStyle}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Producto</label>
          <input
            style={inputStyle}
            list="productos-lista"
            value={productName}
            onChange={(e) => handleProductSelect(e.target.value)}
            placeholder="Elegí del catálogo o escribí uno nuevo"
          />
          <datalist id="productos-lista">
            {products.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
          {selectedProductId ? (
            <p style={{ fontSize: 12, color: "rgba(36,19,34,0.55)", marginTop: 6 }}>
              Vinculado al catálogo — al guardar, se descuenta el stock de este producto en la página.
            </p>
          ) : productName.trim() ? (
            <p style={{ fontSize: 12, color: "rgba(36,19,34,0.4)", marginTop: 6 }}>
              No coincide con ningún producto del catálogo — se registra la venta sin tocar stock.
            </p>
          ) : null}
        </div>

        <div>
          <label style={labelStyle}>Cantidad</label>
          <input
            style={inputStyle}
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div>
          <label style={labelStyle}>Precio unitario (ARS)</label>
          <input
            style={inputStyle}
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Nota (opcional)</label>
          <input style={inputStyle} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Cliente, talle, lo que quieras anotar" />
        </div>

        <div style={{ gridColumn: "1 / -1", fontSize: 14, color: "rgba(36,19,34,0.7)" }}>
          Total: <strong>{formatARS((Number(quantity) || 0) * (Number(unitPrice) || 0))}</strong>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <button type="submit" disabled={saving} style={primaryBtn}>
            {saving ? "Guardando..." : "Registrar venta"}
          </button>
        </div>
      </form>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(["hoy", "semana", "mes", "todo"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...secondaryBtn,
                background: filter === f ? "var(--plum-800)" : "transparent",
                color: filter === f ? "#fff" : "var(--plum-800)",
              }}
            >
              {f === "hoy" ? "Hoy" : f === "semana" ? "7 días" : f === "mes" ? "Este mes" : "Todo"}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--plum-950)" }}>
          Total: {formatARS(total)}
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "rgba(36,19,34,0.5)" }}>No hay ventas registradas en este período.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "10px 14px",
                background: "#fff",
                fontSize: 13,
              }}
            >
              <div style={{ width: 90, color: "rgba(36,19,34,0.5)" }}>{s.date}</div>
              <div style={{ flex: 1 }}>
                <strong>{s.productName}</strong> · {s.quantity} u. × {formatARS(s.unitPrice)}
                {s.note && <div style={{ color: "rgba(36,19,34,0.5)" }}>{s.note}</div>}
              </div>
              <div style={{ width: 100, color: "rgba(36,19,34,0.6)" }}>
                {PAYMENT_LABELS[s.paymentMethod]}
              </div>
              <div style={{ width: 90, fontWeight: 600, textAlign: "right" }}>{formatARS(s.total)}</div>
              <button onClick={() => handleDelete(s.id)} style={{ ...dangerBtn, padding: "6px 12px" }}>
                Borrar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--plum-800)",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  fontSize: 14,
  fontFamily: "var(--font-body)",
  background: "#fff",
};

const primaryBtn: React.CSSProperties = {
  background: "var(--coral-500)",
  color: "#fff",
  border: "none",
  borderRadius: 999,
  padding: "10px 22px",
  fontWeight: 600,
  fontSize: 14,
};

const secondaryBtn: React.CSSProperties = {
  border: "1px solid var(--plum-800)",
  borderRadius: 999,
  padding: "7px 16px",
  fontWeight: 600,
  fontSize: 13,
};

const dangerBtn: React.CSSProperties = {
  background: "transparent",
  color: "#a3271e",
  border: "1px solid #a3271e",
  borderRadius: 999,
  fontWeight: 600,
  fontSize: 12,
};
