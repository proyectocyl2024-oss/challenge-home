"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/data/products";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductInput,
} from "@/lib/products";
import {
  fetchCategories,
  createCategory,
  deleteCategory,
  type Category,
} from "@/lib/categories";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(
    value
  );

export default function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Categorías ---
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // --- Form de producto ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [installmentsCount, setInstallmentsCount] = useState("3");
  const [stock, setStock] = useState("");
  const [colors, setColors] = useState("");
  const [sizes, setSizes] = useState("");
  const [image, setImage] = useState("");
  const [video, setVideo] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState<"" | "nuevo" | "ultimas-unidades" | "sin-stock">("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch (e) {
      console.error(e);
      setError(
        "No se pudo cargar el catálogo. Revisá la configuración de Firebase en lib/firebase.ts."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const cat = await createCategory(newCategoryName.trim());
      setCategories((prev) => [...prev, cat]);
      setNewCategoryName("");
    } catch (e) {
      console.error(e);
      setError("No se pudo crear la categoría.");
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("¿Borrar esta categoría? Los productos que la tenían quedan sin categoría.")) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
      setError("No se pudo borrar la categoría.");
    }
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setCompareAtPrice("");
    setInstallmentsCount("3");
    setStock("");
    setColors("");
    setSizes("");
    setImage("");
    setVideo("");
    setCategory("");
    setTag("");
  }

  function loadIntoForm(p: Product) {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description);
    setPrice(String(p.price));
    setCompareAtPrice(p.compareAtPrice ? String(p.compareAtPrice) : "");
    setInstallmentsCount(p.installments ? String(p.installments.count) : "3");
    setStock(String(p.stock));
    setColors(p.colors.join(", "));
    setSizes(p.sizes.join(", "));
    setImage(p.image);
    setVideo(p.video ?? "");
    setCategory(p.category ?? "");
    setTag((p.tag as any) ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) {
      setError("Nombre y precio son obligatorios.");
      return;
    }
    setSaving(true);
    setError(null);

    const priceNum = Number(price);
    const compareNum = compareAtPrice ? Number(compareAtPrice) : undefined;
    const installmentsCountNum = Number(installmentsCount) || 3;

    const payload: ProductInput = {
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      compareAtPrice: compareNum,
      installments: { count: installmentsCountNum, amount: priceNum / installmentsCountNum },
      stock: Number(stock) || 0,
      colors: colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      sizes: sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      image: image.trim(),
      video: video.trim() || undefined,
      category: category || undefined,
      tag: tag || undefined,
    };

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      resetForm();
      await load();
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar el producto. Revisá la consola para más detalle.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar este producto? Esta acción no se puede deshacer.")) return;
    try {
      await deleteProduct(id);
      await load();
    } catch (e) {
      console.error(e);
      setError("No se pudo borrar el producto.");
    }
  }

  function categoryName(slug?: string) {
    if (!slug) return "Sin categoría";
    return categories.find((c) => c.slug === slug)?.name ?? slug;
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px", fontFamily: "var(--font-body)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--plum-950)" }}>
        Panel de productos — CHALLENGE
      </h1>
      <p style={{ color: "rgba(36,19,34,0.6)", fontSize: 14, marginBottom: 32 }}>
        Cualquiera con este link puede cargar y editar el catálogo — no tiene login. Para un
        catálogo de productos sin datos sensibles está bien así; si en algún momento necesitás
        restringir el acceso, avisame.
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

      {/* --- Categorías --- */}
      <section
        style={{
          background: "var(--cream-100)",
          border: "1px solid var(--line)",
          borderRadius: 20,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--plum-950)", marginBottom: 14 }}>
          Categorías
        </h2>

        <form onSubmit={handleAddCategory} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nombre de la categoría (ej: Ropa deporte)"
          />
          <button type="submit" disabled={savingCategory || !newCategoryName.trim()} style={primaryBtn}>
            {savingCategory ? "Agregando..." : "Agregar"}
          </button>
        </form>

        {categories.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(36,19,34,0.5)" }}>Todavía no creaste ninguna categoría.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((c) => (
              <span
                key={c.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#fff",
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  padding: "6px 8px 6px 14px",
                  fontSize: 13,
                }}
              >
                {c.name}
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  style={{
                    background: "var(--cream-100)",
                    border: "none",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    fontSize: 12,
                    lineHeight: 1,
                    color: "#a3271e",
                    cursor: "pointer",
                  }}
                  title="Borrar categoría"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* --- Form de producto --- */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--cream-100)",
          border: "1px solid var(--line)",
          borderRadius: 20,
          padding: 24,
          marginBottom: 40,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <h2 style={{ gridColumn: "1 / -1", fontFamily: "var(--font-display)", fontSize: 20, color: "var(--plum-950)" }}>
          {editingId ? "Editar producto" : "Nuevo producto"}
        </h2>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Descripción</label>
          <textarea
            style={{ ...inputStyle, minHeight: 70 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label style={labelStyle}>Categoría</label>
          <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Etiqueta</label>
          <select style={inputStyle} value={tag} onChange={(e) => setTag(e.target.value as any)}>
            <option value="">Sin etiqueta</option>
            <option value="nuevo">Nuevo</option>
            <option value="ultimas-unidades">Últimas unidades</option>
            <option value="sin-stock">Sin stock</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Precio (ARS)</label>
          <input
            style={inputStyle}
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Precio anterior (opcional, para % OFF)</label>
          <input
            style={inputStyle}
            type="number"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
          />
        </div>

        <div>
          <label style={labelStyle}>Cantidad de cuotas sin interés</label>
          <input
            style={inputStyle}
            type="number"
            value={installmentsCount}
            onChange={(e) => setInstallmentsCount(e.target.value)}
          />
        </div>

        <div>
          <label style={labelStyle}>Stock</label>
          <input style={inputStyle} type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>Colores (separados por coma)</label>
          <input style={inputStyle} value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Ciruela, Negro" />
        </div>

        <div>
          <label style={labelStyle}>Talles (separados por coma)</label>
          <input style={inputStyle} value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S, M, L" />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>URL de imagen</label>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="preview"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid var(--line)",
                  flexShrink: 0,
                }}
              />
            )}
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://... (Imgur, Mercado Libre, Tienda Nube, etc.)"
            />
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>URL de video (opcional)</label>
          <p style={{ fontSize: 12, color: "rgba(36,19,34,0.55)", marginTop: -2, marginBottom: 10 }}>
            Si cargás un video, se muestra en loop en vez de la foto en la card del producto.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {video && (
              <video
                src={video}
                muted
                loop
                autoPlay
                playsInline
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid var(--line)",
                  flexShrink: 0,
                }}
              />
            )}
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              placeholder="https://... (link directo a un .mp4)"
            />
            {video && (
              <button
                type="button"
                onClick={() => setVideo("")}
                style={{ ...dangerBtn, padding: "8px 14px", flexShrink: 0 }}
              >
                Quitar
              </button>
            )}
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, marginTop: 8 }}>
          <button type="submit" disabled={saving} style={primaryBtn}>
            {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar producto"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={secondaryBtn}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--plum-950)", marginBottom: 16 }}>
        Productos cargados {loading ? "" : `(${products.length})`}
      </h2>

      {loading ? (
        <p>Cargando...</p>
      ) : products.length === 0 ? (
        <p style={{ color: "rgba(36,19,34,0.6)" }}>Todavía no hay productos cargados.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                border: "1px solid var(--line)",
                borderRadius: 14,
                padding: "12px 16px",
                background: "#fff",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "var(--cream-100)",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: "rgba(36,19,34,0.6)" }}>
                  {formatARS(p.price)} · stock {p.stock} · {categoryName(p.category)}
                </div>
              </div>
              <button onClick={() => loadIntoForm(p)} style={secondaryBtn}>
                Editar
              </button>
              <button onClick={() => handleDelete(p.id)} style={dangerBtn}>
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
  background: "transparent",
  color: "var(--plum-800)",
  border: "1px solid var(--plum-800)",
  borderRadius: 999,
  padding: "10px 18px",
  fontWeight: 600,
  fontSize: 13,
};

const dangerBtn: React.CSSProperties = {
  background: "transparent",
  color: "#a3271e",
  border: "1px solid #a3271e",
  borderRadius: 999,
  padding: "10px 18px",
  fontWeight: 600,
  fontSize: 13,
};
