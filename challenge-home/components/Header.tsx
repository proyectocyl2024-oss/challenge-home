"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { fetchCategories, type Category } from "@/lib/categories";

export default function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.openCart);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((e) => console.error("No se pudieron cargar las categorías del menú:", e));
  }, []);

  return (
    <header className="site-header">
      <div className="site-header__row">
        <a href="/" className="site-header__logo">
          CHALLENGE
        </a>

        <nav className="site-header__nav">
          <a href="/#destacados">Destacados</a>
          {categories.map((c) => (
            <a key={c.id} href={`/?categoria=${c.slug}#destacados`}>
              {c.name}
            </a>
          ))}
        </nav>

        <button className="cart-button" onClick={openCart}>
          Carrito
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </button>
      </div>
    </header>
  );
}
