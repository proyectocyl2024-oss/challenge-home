import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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

export async function logStockChange(entry: StockLogEntry) {
  const db = getDb();
  return addDoc(collection(db, COLLECTION), {
    ...entry,
    createdAt: serverTimestamp(),
  });
}
