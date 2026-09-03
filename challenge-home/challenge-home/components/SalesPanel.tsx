"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { fetchProducts, adjustProductStock } from "@/lib/products";
import { fetchCategories, type Category } from "@/lib/categories";
import { createSale, type PaymentMethod } from "@/lib/sales";
import { downloadReceiptPdf } from "@/lib/receipt";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(
    value
  );

const todayISO = () => new Date().toISOString().slice(0, 10);

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "posnet", label: "Posnet" },
];

type CartLine = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
};

export default function SalesPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [confirming, setConfirming] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lastReceipt, setLastReceipt] = useState<{
    date: string;
    lines: CartLine[];
    total: number;
    paymentLabel: string;
    customerName: string;
    customerPhone: string;
  } | null>(null);

  // --- Modo manual: para vender algo que no está en el catálogo ---
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualQty, setManualQty] = useState("1");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el catálogo. Revisá la configuración de Firebase.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCategory, search]);

  function addToCart(p: Product) {
    if (p.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) return prev; // no superar el stock disponible
        return prev.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 1, maxStock: p.stock }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productId === productId
            ? { ...l, quantity: Math.max(0, Math.min(l.maxStock, l.quantity + delta)) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  function addManualToCart() {
    const price = Number(manualPrice) || 0;
    const qty = Number(manualQty) || 1;
    if (!manualName.trim() || price <= 0) return;
    setCart((prev) => [
      ...prev,
      {
        productId: `manual-${Date.now()}`,
        name: manualName.trim(),
        price,
        quantity: qty,
        maxStock: Infinity,
      },
    ]);
    setManualName("");
    setManualPrice("");
    setManualQty("1");
    setManualOpen(false);
  }

  const subtotal = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);

  async function handleConfirm() {
    if (cart.length === 0) return;
    setConfirming(true);
    setError(null);
    const date = todayISO();
    try {
      for (const line of cart) {
        const isManual = line.productId.startsWith("manual-");
        await createSale({
          date,
          productId: isManual ? undefined : line.productId,
          productName: line.name,
          quantity: line.quantity,
          unitPrice: line.price,
          total: line.price * line.quantity,
          paymentMethod,
        });
        if (!isManual) {
          await adjustProductStock(line.productId, -line.quantity);
        }
      }
      setLastReceipt({
        date,
        lines: cart,
        total: subtotal,
        paymentLabel: PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label ?? paymentMethod,
        customerName,
        customerPhone,
      });
      setCart([]);
      setPaymentMethod("efectivo");
      setCustomerName("");
      setCustomerPhone("");
      await load();
    } catch (e) {
      console.error(e);
      setError("No se pudo confirmar la venta. Revisá la consola para más detalle.");
    } finally {
      setConfirming(false);
    }
  }

  function handleDownloadPdf() {
    if (!lastReceipt) return;
    downloadReceiptPdf({
      date: lastReceipt.date,
      lines: lastReceipt.lines.map((l) => ({
        name: l.name,
        quantity: l.quantity,
        unitPrice: l.price,
        total: l.price * l.quantity,
      })),
      total: lastReceipt.total,
      paymentMethod: lastReceipt.paymentLabel,
      customerName: lastReceipt.customerName || undefined,
    });
  }

  function handleSendWhatsApp() {
    if (!lastReceipt) return;
    handleDownloadPdf();
    const message = `¡Hola${lastReceipt.customerName ? " " + lastReceipt.customerName : ""}! Te paso el comprobante de tu compra en CHALLENGE por ${formatARS(
      lastReceipt.total
    )}. Te adjunto el PDF con el detalle.`;
    const phone = lastReceipt.customerPhone.replace(/[^0-9]/g, "");
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Cargando...</div>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      {/* --- Columna izquierda: catálogo --- */}
      <div style={{ flex: 1, padding: "28px 24px", overflowY: "auto" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            color: "var(--plum-950)",
            marginBottom: 18,
          }}
        >
          Ventas — CHALLENGE
        </h1>

        {error && (
          <div
            style={{
              background: "#fdeceb",
              color: "#a3271e",
              padding: "12px 16px",
              borderRadius: 10,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto o SKU..."
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid var(--line)",
            fontSize: 14,
            marginBottom: 14,
            background: "#fff",
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={pillStyle(activeCategory === null)}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.slug)}
              style={pillStyle(activeCategory === c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 14,
          }}
        >
          {filteredProducts.map((p) => {
            const outOfStock = p.stock <= 0;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={outOfStock}
                style={{
                  textAlign: "left",
                  border: "1px solid var(--line)",
                  borderRadius: 16,
                  padding: 10,
                  background: "#fff",
                  cursor: outOfStock ? "not-allowed" : "pointer",
                  opacity: outOfStock ? 0.5 : 1,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: outOfStock ? "#a3271e" : "var(--plum-800)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: "2px 8px",
                  }}
                >
                  {outOfStock ? "0" : p.stock}
                </div>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "var(--cream-100)",
                    marginBottom: 8,
                  }}
                >
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--plum-950)", marginBottom: 4 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{formatARS(p.price)}</div>
              </button>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <p style={{ color: "rgba(36,19,34,0.5)", marginTop: 20 }}>No hay productos que coincidan.</p>
        )}

        <div style={{ marginTop: 28 }}>
          <button
            onClick={() => setManualOpen((v) => !v)}
            style={{
              background: "transparent",
              border: "1px dashed var(--plum-800)",
              color: "var(--plum-800)",
              borderRadius: 12,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {manualOpen ? "Cancelar" : "+ Vender algo que no está en el catálogo"}
          </button>

          {manualOpen && (
            <div
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr auto",
                gap: 10,
                alignItems: "end",
                background: "var(--cream-100)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div>
                <label style={smallLabel}>Descripción</label>
                <input style={smallInput} value={manualName} onChange={(e) => setManualName(e.target.value)} />
              </div>
              <div>
                <label style={smallLabel}>Precio</label>
                <input
                  style={smallInput}
                  type="number"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                />
              </div>
              <div>
                <label style={smallLabel}>Cant.</label>
                <input
                  style={smallInput}
                  type="number"
                  min="1"
                  value={manualQty}
                  onChange={(e) => setManualQty(e.target.value)}
                />
              </div>
              <button
                onClick={addManualToCart}
                style={{
                  background: "var(--coral-500)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Agregar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- Columna derecha: carrito --- */}
      <div
        style={{
          width: 340,
          borderLeft: "1px solid var(--line)",
          background: "var(--cream-50)",
          padding: "28px 20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--plum-950)", marginBottom: 16 }}>
          Carrito {cart.length > 0 && `(${cart.length})`}
        </h2>

        {cart.length === 0 ? (
          <p style={{ color: "rgba(36,19,34,0.5)", fontSize: 14 }}>Tocá un producto para agregarlo.</p>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
            {cart.map((l) => (
              <div
                key={l.productId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(36,19,34,0.5)" }}>{formatARS(l.price)} c/u</div>
                </div>
                <button onClick={() => changeQty(l.productId, -1)} style={qtyBtn}>
                  −
                </button>
                <span style={{ fontSize: 13, width: 20, textAlign: "center" }}>{l.quantity}</span>
                <button onClick={() => changeQty(l.productId, 1)} style={qtyBtn} disabled={l.quantity >= l.maxStock}>
                  +
                </button>
                <button
                  onClick={() => removeLine(l.productId)}
                  style={{ background: "none", border: "none", color: "#a3271e", fontSize: 16, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
          <span>Total</span>
          <span>{formatARS(subtotal)}</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={smallLabel}>Cliente (opcional, para el comprobante)</label>
          <input
            style={{ ...smallInput, marginBottom: 8 }}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nombre"
          />
          <input
            style={smallInput}
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="WhatsApp (ej: 5491122334455)"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={smallLabel}>Forma de pago</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPaymentMethod(opt.value)}
                style={pillStyle(paymentMethod === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={cart.length === 0 || confirming}
          style={{
            background: cart.length === 0 ? "rgba(36,19,34,0.2)" : "var(--coral-500)",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "14px 20px",
            fontWeight: 700,
            fontSize: 15,
            cursor: cart.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {confirming ? "Confirmando..." : "Confirmar venta"}
        </button>

        {cart.length > 0 && (
          <button
            onClick={() => setCart([])}
            style={{
              background: "none",
              border: "none",
              color: "rgba(36,19,34,0.5)",
              fontSize: 12,
              marginTop: 10,
              textDecoration: "underline",
            }}
          >
            Limpiar carrito
          </button>
        )}

        {lastReceipt && (
          <div
            style={{
              marginTop: 20,
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--plum-950)", marginBottom: 4 }}>
              ✓ Venta confirmada
            </div>
            <div style={{ fontSize: 13, color: "rgba(36,19,34,0.6)", marginBottom: 12 }}>
              Total: {formatARS(lastReceipt.total)}
            </div>
            <button
              onClick={handleDownloadPdf}
              style={{ ...pillStyle(false), width: "100%", marginBottom: 8, padding: "10px 14px" }}
            >
              Descargar comprobante (PDF)
            </button>
            <button
              onClick={handleSendWhatsApp}
              style={{
                width: "100%",
                background: "#25D366",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "10px 14px",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Enviar por WhatsApp
            </button>
            <p style={{ fontSize: 11, color: "rgba(36,19,34,0.5)", marginTop: 10 }}>
              El botón de WhatsApp descarga el PDF y abre el chat con un mensaje listo — adjuntá el
              archivo descargado manualmente ahí (clip → elegir archivo).
            </p>
            <button
              onClick={() => setLastReceipt(null)}
              style={{ background: "none", border: "none", color: "rgba(36,19,34,0.4)", fontSize: 11, marginTop: 8 }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    border: "1px solid var(--plum-800)",
    borderRadius: 999,
    padding: "7px 14px",
    fontSize: 12,
    fontWeight: 600,
    background: active ? "var(--plum-800)" : "transparent",
    color: active ? "#fff" : "var(--plum-800)",
  };
}

const qtyBtn: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  border: "1px solid var(--line)",
  background: "#fff",
  fontSize: 13,
  cursor: "pointer",
};

const smallLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--plum-800)",
  marginBottom: 4,
};

const smallInput: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  fontSize: 13,
  background: "#fff",
};
