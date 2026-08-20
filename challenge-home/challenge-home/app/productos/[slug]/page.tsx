"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/data/products";
import { fetchProductBySlug } from "@/lib/products";
import { useCartStore } from "@/store/cartStore";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(
    value
  );

export default function ProductoPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!slug) return;
    fetchProductBySlug(slug)
      .then((p) => {
        setProduct(p);
        if (p) {
          setSelectedColor(p.colors[0] ?? "");
          setSelectedSize(p.sizes[0] ?? "");
        }
      })
      .catch((e) => {
        console.error("Error trayendo el producto:", e);
        setProduct(null);
      });
  }, [slug]);

  if (product === undefined) {
    return (
      <>
        <Header />
        <div style={{ padding: "80px 24px", textAlign: "center", color: "rgba(36,19,34,0.5)" }}>
          Cargando...
        </div>
      </>
    );
  }

  if (product === null) {
    return (
      <>
        <Header />
        <div style={{ padding: "80px 24px", textAlign: "center" }}>
          <p style={{ color: "rgba(36,19,34,0.6)", marginBottom: 16 }}>
            No encontramos este producto.
          </p>
          <Link href="/" className="hero__cta">
            Volver al catálogo
          </Link>
        </div>
      </>
    );
  }

  const outOfStock = product.stock === 0;
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
      : null;

  const handleAdd = () => {
    if (outOfStock) return;
    addItem(product, selectedColor, selectedSize, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <>
      <Header />

      <div className="product-detail">
        <Link href="/#destacados" className="product-detail__back">
          ← Volver al catálogo
        </Link>

        <div className="product-detail__grid">
          <div className="product-detail__media">
            {product.video ? (
              <video
                src={product.video}
                poster={product.image || undefined}
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              product.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt={product.name} />
              )
            )}
            {outOfStock ? (
              <span className="product-card__badge product-card__badge--out">Sin stock</span>
            ) : product.tag === "nuevo" ? (
              <span className="product-card__badge">Nuevo</span>
            ) : discount ? (
              <span className="product-card__badge product-card__badge--sale">{discount}% OFF</span>
            ) : null}
          </div>

          <div className="product-detail__info">
            <h1 className="product-detail__name">{product.name}</h1>

            <div className="product-detail__prices">
              <span className="product-detail__price">{formatARS(product.price)}</span>
              {product.compareAtPrice && (
                <span className="product-card__compare">{formatARS(product.compareAtPrice)}</span>
              )}
            </div>

            {product.installments && (
              <div className="product-card__installments" style={{ marginBottom: 20 }}>
                {product.installments.count}x {formatARS(product.installments.amount)} sin interés
              </div>
            )}

            {product.description && (
              <p className="product-detail__description">{product.description}</p>
            )}

            {product.colors.length > 0 && (
              <div className="product-detail__field">
                <label>Color</label>
                <div className="product-detail__options">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      className={`product-detail__option ${selectedColor === c ? "product-detail__option--active" : ""}`}
                      onClick={() => setSelectedColor(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.sizes.length > 0 && (
              <div className="product-detail__field">
                <label>Talle</label>
                <div className="product-detail__options">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      className={`product-detail__option ${selectedSize === s ? "product-detail__option--active" : ""}`}
                      onClick={() => setSelectedSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="product-detail__field">
              <label>Cantidad</label>
              <div className="cart-line__qty" style={{ marginTop: 6 }}>
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)}>+</button>
              </div>
            </div>

            <button
              className="hero__cta product-detail__cta"
              onClick={handleAdd}
              disabled={outOfStock}
            >
              {outOfStock ? "Sin stock" : added ? "¡Agregado al carrito!" : "Agregar al carrito"}
            </button>
          </div>
        </div>
      </div>

      <CartDrawer />
    </>
  );
}
