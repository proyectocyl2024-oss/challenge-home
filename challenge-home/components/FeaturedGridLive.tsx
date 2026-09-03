"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/data/products";
import { featuredProducts as fallbackProducts } from "@/data/products";
import { fetchProducts } from "@/lib/products";
import FeaturedGrid from "./FeaturedGrid";

export default function FeaturedGridLive() {
  const searchParams = useSearchParams();
  const categoriaFromUrl = searchParams.get("categoria");

  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetchProducts()
      .then((prods) => {
        setProducts(prods.length > 0 ? prods : fallbackProducts);
      })
      .catch((e) => {
        console.error("Error trayendo el catálogo de Firestore, usando datos de ejemplo:", e);
        setProducts(fallbackProducts);
      });
  }, []);

  const list = products ?? fallbackProducts;

  const filtered = useMemo(() => {
    // Solo productos marcados para mostrar en la home (featured !== false)
    let base = list.filter((p) => p.featured !== false);
    if (categoriaFromUrl) {
      base = base.filter((p) => p.category === categoriaFromUrl);
    }
    return base;
  }, [list, categoriaFromUrl]);

  return <FeaturedGrid title="Destacados" products={filtered} viewAllHref="/productos" />;
}
