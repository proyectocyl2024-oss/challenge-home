"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/data/products";
import { featuredProducts as fallbackProducts } from "@/data/products";
import { fetchProducts } from "@/lib/products";
import { fetchCategories, type Category } from "@/lib/categories";
import FeaturedGrid from "./FeaturedGrid";

export default function FeaturedGridLive() {
  const searchParams = useSearchParams();
  const categoriaFromUrl = searchParams.get("categoria");

  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(categoriaFromUrl);

  useEffect(() => {
    setActiveCategory(categoriaFromUrl);
  }, [categoriaFromUrl]);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([prods, cats]) => {
        setProducts(prods.length > 0 ? prods : fallbackProducts);
        setCategories(cats);
      })
      .catch((e) => {
        console.error("Error trayendo el catálogo de Firestore, usando datos de ejemplo:", e);
        setProducts(fallbackProducts);
      });
  }, []);

  const list = products ?? fallbackProducts;

  const filtered = useMemo(() => {
    if (!activeCategory) return list;
    return list.filter((p) => p.category === activeCategory);
  }, [list, activeCategory]);

  return (
    <>
      {categories.length > 0 && (
        <div className="category-pills">
          <button
            className={`category-pill ${activeCategory === null ? "category-pill--active" : ""}`}
            onClick={() => setActiveCategory(null)}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`category-pill ${activeCategory === c.slug ? "category-pill--active" : ""}`}
              onClick={() => setActiveCategory(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      <FeaturedGrid title="Destacados" products={filtered} viewAllHref="/productos" />
    </>
  );
}
