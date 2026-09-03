const SESSION_KEY = "challenge_admin_session";
const SESSION_HOURS = 12;

// PIN simple, fijo en el código (o por variable de entorno NEXT_PUBLIC_ADMIN_PIN).
// Cambialo acá directamente cuando quieras uno distinto.
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "2580";

export async function verifyPin(pin: string): Promise<boolean> {
  return pin.trim() === ADMIN_PIN;
}

export function hasValidSession(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return false;
  const expiresAt = Number(raw);
  if (Number.isNaN(expiresAt)) return false;
  return Date.now() < expiresAt;
}

export function startSession() {
  if (typeof window === "undefined") return;
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  window.localStorage.setItem(SESSION_KEY, String(expiresAt));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
