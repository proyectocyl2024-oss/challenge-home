import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { getDb } from "./firebase";

const COLLECTION = "challenge_stock_log";

export type StockLogEntry = {
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  motivo: string;
  firma: string;
};

export type StockLogRecord = StockLogEntry & {
  id: string;
  createdAt?: string; // fecha legible, si está disponible
};

export async function logStockChange(entry: StockLogEntry) {
  const db = getDb();
  return addDoc(collection(db, COLLECTION), {
    ...entry,
    createdAt: serverTimestamp(),
  });
}

export async function fetchStockLog(): Promise<StockLogRecord[]> {
  const db = getDb();
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
    return {
      id: d.id,
      productId: data.productId ?? "",
      productName: data.productName ?? "",
      previousStock: data.previousStock ?? 0,
      newStock: data.newStock ?? 0,
      motivo: data.motivo ?? "",
      firma: data.firma ?? "",
      createdAt: ts ? ts.toLocaleString("es-AR") : undefined,
    } as StockLogRecord;
  });
}
