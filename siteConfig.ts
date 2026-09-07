import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";

const DOC_PATH = "challenge_config/site";

export type SiteConfig = {
  heroVideoUrl?: string;
};

export async function fetchSiteConfig(): Promise<SiteConfig> {
  const db = getDb();
  const snap = await getDoc(doc(db, DOC_PATH));
  if (!snap.exists()) return {};
  const data = snap.data();
  return {
    heroVideoUrl: data.heroVideoUrl ?? undefined,
  };
}

export async function updateSiteConfig(patch: SiteConfig): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, DOC_PATH), patch, { merge: true });
}
