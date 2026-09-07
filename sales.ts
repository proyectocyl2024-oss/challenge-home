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

const COLLECTION = "challenge_ventas";

export type PaymentMethod = "efectivo" | "transferencia" | "posnet";

export type Sale = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  productId?: string; // vincula con challenge_productos, si corresponde a uno del catálogo
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paymentMethod: PaymentMethod;
  note?: string;
};

export type SaleInput = Omit<Sale, "id">;

function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  const clean = { ...obj };
  Object.keys(clean).forEach((key) => {
    if (clean[key] === undefined) delete clean[key];
  });
  return clean;
}

export async function fetchSales(): Promise<Sale[]> {
  const db = getDb();
  const q = query(collection(db, COLLECTION), orderBy("date", "desc"));
  const snap = await getDocs(q);
  const sales = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      date: data.date ?? "",
      time: data.time ?? "",
      productId: data.productId ?? undefined,
      productName: data.productName ?? "",
      quantity: data.quantity ?? 1,
      unitPrice: data.unitPrice ?? 0,
      total: data.total ?? 0,
      paymentMethod: data.paymentMethod ?? "efectivo",
      note: data.note ?? undefined,
    } as Sale;
  });
  // Firestore solo ordena por "date"; dentro del mismo día, ordenamos por hora acá.
  return sales.sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
}

export async function createSale(input: SaleInput) {
  const db = getDb();
  return addDoc(
    collection(db, COLLECTION),
    removeUndefined({ ...input, createdAt: serverTimestamp() })
  );
}

export async function deleteSale(id: string) {
  const db = getDb();
  return deleteDoc(doc(db, COLLECTION, id));
}

export async function updateSale(id: string, patch: Partial<SaleInput>) {
  const db = getDb();
  return updateDoc(doc(db, COLLECTION, id), removeUndefined({ ...patch }));
}
