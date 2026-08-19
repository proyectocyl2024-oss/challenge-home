"use client";

import { useState } from "react";
import type { Product } from "@/data/products";
import { useCartStore } from "@/store/cartStore";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value);

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [adding, setAdding] = useState(false);

  const outOfStock = product.stock === 0;
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
      : null;

  const handleAdd = () => {
    if (outOfStock) return;
    addItem(product, product.colors[0], product.sizes[0]);
    setAdding(true);
    setTimeout(() => setAdding(false), 1200);
  };

  return (
    <div className="product-card">
      <div className="product-card__frame">
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
            <img src={product.image} alt={product.name} loading="lazy" />
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

      <h3 className="product-card__name">{product.name}</h3>

      <div className="product-card__prices">
        <span className="product-card__price">{formatARS(product.price)}</span>
        {product.compareAtPrice && (
          <span className="product-card__compare">{formatARS(product.compareAtPrice)}</span>
        )}
      </div>

      {product.installments && (
        <div className="product-card__installments">
          {product.installments.count}x {formatARS(product.installments.amount)} sin interés
        </div>
      )}

      <button className="product-card__cta" onClick={handleAdd} disabled={outOfStock}>
        {outOfStock ? "Sin stock" : adding ? "¡Agregado!" : "Agregar al carrito"}
      </button>
    </div>
  );
}
