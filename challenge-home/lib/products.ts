import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
  runTransaction,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { Product, ProductVariant } from "@/data/products";

const COLLECTION = "challenge_productos";

export type ProductInput = Omit<Product, "id" | "slug"> & { slug?: string };

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Firestore rechaza cualquier campo con valor "undefined" — hay que sacarlo
// del objeto directamente, no alcanza con que su valor sea undefined.
function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  const clean = { ...obj };
  Object.keys(clean).forEach((key) => {
    if (clean[key] === undefined) {
      delete clean[key];
    }
  });
  return clean;
}

export async function fetchProducts(): Promise<Product[]> {
  const db = getDb();
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      slug: data.slug ?? slugify(data.name ?? ""),
      sku: data.sku ?? undefined,
      name: data.name ?? "",
      description: data.description ?? "",
      price: data.price ?? 0,
      compareAtPrice: data.compareAtPrice ?? undefined,
      installments: data.installments ?? undefined,
      stock: data.stock ?? 0,
      variants: Array.isArray(data.variants) ? data.variants : undefined,
      colors: data.colors ?? [],
      sizes: data.sizes ?? [],
      image: data.image ?? "",
      images: Array.isArray(data.images) ? data.images : undefined,
      video: data.video ?? undefined,
      category: data.category ?? undefined,
      featured: data.featured ?? true,
      tag: data.tag ?? undefined,
    } as Product;
  });
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const products = await fetchProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function createProduct(input: ProductInput) {
  const db = getDb();
  const slug = input.slug || slugify(input.name);
  return addDoc(
    collection(db, COLLECTION),
    removeUndefined({
      ...input,
      slug,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const db = getDb();
  const patch: Record<string, unknown> = { ...input, updatedAt: serverTimestamp() };
  if (input.name && !input.slug) {
    patch.slug = slugify(input.name);
  }
  return updateDoc(doc(db, COLLECTION, id), removeUndefined(patch));
}

export async function deleteProduct(id: string) {
  const db = getDb();
  return deleteDoc(doc(db, COLLECTION, id));
}

// Suma o resta stock de forma segura (transacción: lee el valor actual y lo
// actualiza en un solo paso, para que dos ventas registradas casi al mismo
// tiempo no se pisen entre sí). delta negativo = descuenta, positivo = repone.
// Nunca deja el stock por debajo de 0.
export async function adjustProductStock(id: string, delta: number): Promise<void> {
  const db = getDb();
  const ref = doc(db, COLLECTION, id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const current = (snap.data().stock as number) ?? 0;
    const next = Math.max(0, current + delta);
    tx.update(ref, { stock: next, updatedAt: serverTimestamp() });
  });
}

// Igual que adjustProductStock, pero para un producto con stock por
// combinación de color+talle: ajusta esa variante puntual y recalcula el
// total (suma de todas las variantes) en el mismo paso.
export async function adjustVariantStock(
  id: string,
  color: string,
  size: string,
  delta: number
): Promise<void> {
  const db = getDb();
  const ref = doc(db, COLLECTION, id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const variants: ProductVariant[] = Array.isArray(data.variants) ? data.variants : [];
    let found = false;
    const updated = variants.map((v) => {
      if (v.color === color && v.size === size) {
        found = true;
        return { ...v, stock: Math.max(0, (v.stock ?? 0) + delta) };
      }
      return v;
    });
    if (!found) {
      // No existía esa combinación puntual: la creamos (puede pasar si se
      // vendió algo cargado antes de tener variantes armadas).
      updated.push({ color, size, stock: Math.max(0, delta) });
    }
    const total = updated.reduce((sum, v) => sum + (v.stock ?? 0), 0);
    tx.update(ref, { variants: updated, stock: total, updatedAt: serverTimestamp() });
  });
}
