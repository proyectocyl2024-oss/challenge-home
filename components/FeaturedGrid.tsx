import type { Product } from "@/data/products";
import ProductCard from "./ProductCard";

export default function FeaturedGrid({
  title,
  products,
  viewAllHref,
}: {
  title: string;
  products: Product[];
  viewAllHref?: string;
}) {
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title">{title}</h2>
        {viewAllHref && (
          <a className="section__link" href={viewAllHref}>
            Ver todos
          </a>
        )}
      </div>
      <div className="product-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && (
        <p style={{ color: "rgba(36,19,34,0.5)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
          Todavía no hay productos cargados.
        </p>
      )}
    </section>
  );
}
