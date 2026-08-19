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
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { Product } from "@/data/products";

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
      name: data.name ?? "",
      description: data.description ?? "",
      price: data.price ?? 0,
      compareAtPrice: data.compareAtPrice ?? undefined,
      installments: data.installments ?? undefined,
      stock: data.stock ?? 0,
      colors: data.colors ?? [],
      sizes: data.sizes ?? [],
      image: data.image ?? "",
      video: data.video ?? undefined,
      category: data.category ?? undefined,
      tag: data.tag ?? undefined,
    } as Product;
  });
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
