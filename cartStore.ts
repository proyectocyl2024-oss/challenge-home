import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/data/products";

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  addItem: (product: Product, color: string, size: string, qty?: number) => void;
  removeLine: (productId: string, color: string, size: string) => void;
  setQuantity: (productId: string, color: string, size: string, qty: number) => void;
  openCart: () => void;
  closeCart: () => void;
  clear: () => void;
  totalItems: () => number;
  subtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,

      addItem: (product, color, size, qty = 1) => {
        set((state) => {
          const existing = state.lines.find(
            (l) => l.productId === product.id && l.color === color && l.size === size
          );
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l === existing ? { ...l, quantity: l.quantity + qty } : l
              ),
              isOpen: true,
            };
          }
          return {
            lines: [
              ...state.lines,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                color,
                size,
                quantity: qty,
              },
            ],
            isOpen: true,
          };
        });
      },

      removeLine: (productId, color, size) => {
        set((state) => ({
          lines: state.lines.filter(
            (l) => !(l.productId === productId && l.color === color && l.size === size)
          ),
        }));
      },

      setQuantity: (productId, color, size, qty) => {
        set((state) => ({
          lines: state.lines
            .map((l) =>
              l.productId === productId && l.color === color && l.size === size
                ? { ...l, quantity: qty }
                : l
            )
            .filter((l) => l.quantity > 0),
        }));
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      clear: () => set({ lines: [] }),

      totalItems: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: () => get().lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    }),
    { name: "challenge-cart" }
  )
);
