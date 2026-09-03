export type Product = {
  id: string;
  slug: string;
  sku?: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  installments?: { count: number; amount: number };
  stock: number;
  colors: string[];
  sizes: string[];
  image: string;
  video?: string; // opcional: si está, se muestra en loop en vez de la foto
  category?: string; // slug de la categoría (ver lib/categories.ts)
  featured?: boolean; // si es false, no se muestra en la home. Default true.
  tag?: "nuevo" | "ultimas-unidades" | "sin-stock";
};

// Productos de ejemplo: vacío a propósito. La home trae el catálogo real desde
// Firestore; este array solo se usa como respaldo si falla la conexión, para
// que la página no rompa (pero no muestra nada de relleno).
export const featuredProducts: Product[] = [];
