"use client";

import { useCartStore } from "@/store/cartStore";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value);

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const subtotal = useCartStore((s) => s.subtotal());

  if (!isOpen) return null;

  const handleCheckout = () => {
    if (lines.length === 0) return;
    const url = buildWhatsAppUrl(lines, subtotal);
    window.open(url, "_blank");
  };

  return (
    <div className="cart-overlay" onClick={closeCart}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer__head">
          <span className="cart-drawer__title">Tu carrito</span>
          <button className="cart-drawer__close" onClick={closeCart} aria-label="Cerrar carrito">
            ✕
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="cart-drawer__empty">Todavía no agregaste productos.</div>
        ) : (
          <div style={{ overflowY: "auto", flex: 1 }}>
            {lines.map((line) => (
              <div className="cart-line" key={`${line.productId}-${line.color}-${line.size}`}>
                <div className="cart-line__frame">
                  {line.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.image} alt={line.name} />
                  )}
                </div>
                <div className="cart-line__meta">
                  <div className="cart-line__name">{line.name}</div>
                  <div className="cart-line__variant">
                    {line.color} · Talle {line.size}
                  </div>
                  <div className="cart-line__qty">
                    <button
                      onClick={() =>
                        setQuantity(line.productId, line.color, line.size, line.quantity - 1)
                      }
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      onClick={() =>
                        setQuantity(line.productId, line.color, line.size, line.quantity + 1)
                      }
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeLine(line.productId, line.color, line.size)}
                      style={{ marginLeft: 8, border: "none", background: "none", fontSize: 12 }}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {formatARS(line.price * line.quantity)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cart-drawer__footer">
          <div className="cart-drawer__subtotal">
            <span>Subtotal</span>
            <span>{formatARS(subtotal)}</span>
          </div>
          <button
            className="cart-drawer__checkout"
            onClick={handleCheckout}
            disabled={lines.length === 0}
          >
            Enviar pedido por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
