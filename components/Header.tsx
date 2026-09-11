"use client";

import { useCartStore } from "@/store/cartStore";

export default function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.openCart);

  return (
    <header className="site-header">
      <div className="site-header__row">
        <a href="/" className="site-header__logo">
          CHALLENGE
        </a>

        <nav className="site-header__nav">
          <a href="/#destacados">Destacados</a>
        </nav>

        <button className="cart-button" onClick={openCart}>
          Carrito
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </button>
      </div>
    </header>
  );
}
