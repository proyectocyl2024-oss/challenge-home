// Número real del negocio: código de país + área + número, sin espacios,
// guiones ni el signo "+".
export const WHATSAPP_NUMBER = "5491137952557";

import type { CartLine } from "@/store/cartStore";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(
    value
  );

export function buildOrderMessage(lines: CartLine[], subtotal: number): string {
  const header = "¡Hola! Quiero hacer este pedido de CHALLENGE:";

  const items = lines
    .map(
      (l, i) =>
        `${i + 1}. ${l.name} — ${l.color} / Talle ${l.size} — Cant: ${l.quantity} — ${formatARS(
          l.price * l.quantity
        )}`
    )
    .join("\n");

  const footer = `\nSubtotal: ${formatARS(subtotal)}\n\nMe gustaría coordinar el pago y el envío.`;

  return `${header}\n\n${items}\n${footer}`;
}

export function buildWhatsAppUrl(lines: CartLine[], subtotal: number): string {
  const message = buildOrderMessage(lines, subtotal);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
