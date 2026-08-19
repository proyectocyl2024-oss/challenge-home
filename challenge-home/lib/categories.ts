import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { getDb } from "./firebase";

const COLLECTION = "challenge_categorias";

export type Category = {
  id: string;
  name: string;
  slug: string;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function fetchCategories(): Promise<Category[]> {
  const db = getDb();
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name ?? "",
      slug: data.slug ?? slugify(data.name ?? ""),
    };
  });
}

export async function createCategory(name: string): Promise<Category> {
  const db = getDb();
  const slug = slugify(name);
  const ref = await addDoc(collection(db, COLLECTION), {
    name: name.trim(),
    slug,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, name: name.trim(), slug };
}

export async function deleteCategory(id: string) {
  const db = getDb();
  return deleteDoc(doc(db, COLLECTION, id));
}
