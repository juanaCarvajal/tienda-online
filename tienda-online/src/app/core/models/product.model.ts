/**
 * Producto de la tienda = una carta Pokémon TCG.
 * Este es el modelo que usa toda la app (catálogo, detalle y carrito).
 * Se arma a partir de las respuestas de TCGdex (ver ProductService).
 */
export interface Product {
  /** Id global de la carta en TCGdex, ej. "sv03.5-025" */
  id: string;
  /** Nombre de la carta, ej. "Pikachu" */
  title: string;
  /** Imagen pequeña para listas */
  thumbnail: string;
  /** Imagen grande para el detalle */
  image: string;
  /** Nombre de la expansión (set) */
  setName?: string;
  /** Número de la carta dentro de la expansión */
  number?: string;
  rarity?: string;
  category?: string;
  hp?: number;
  types?: string[];
  illustrator?: string;
  description?: string;
  attacks?: Attack[];
  /** Precio de referencia de mercado (null si la carta no tiene precio publicado) */
  price: number | null;
  /** Moneda del precio: EUR (Cardmarket) o USD (TCGPlayer) */
  currency: 'EUR' | 'USD';
  /** De dónde salió el precio */
  priceSource?: 'Cardmarket' | 'TCGPlayer';
}

export interface Attack {
  name: string;
  cost?: string[];
  damage?: string | number;
  effect?: string;
}

/** Página de resultados del catálogo */
export interface ProductPage {
  products: Product[];
  hasMore: boolean;
}

/** Expansión (set) usada como "categoría" del catálogo */
export interface Category {
  id: string;
  name: string;
  logo?: string;
  total?: number;
}

// ---------- Formato crudo de TCGdex (solo lo que se usa) ----------

export interface TcgCardResume {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

export interface TcgCard extends TcgCardResume {
  category?: string;
  illustrator?: string;
  rarity?: string;
  hp?: number;
  types?: string[];
  description?: string;
  effect?: string;
  attacks?: Attack[];
  set?: { id: string; name: string; logo?: string };
  pricing?: {
    cardmarket?: { avg?: number; trend?: number; low?: number; [k: string]: unknown } | null;
    tcgplayer?: Record<string, unknown> | null;
  } | null;
}

export interface TcgSetResume {
  id: string;
  name: string;
  logo?: string;
  cardCount?: { total: number; official: number };
}

export interface TcgSet extends TcgSetResume {
  releaseDate?: string;
  cards: TcgCardResume[];
}
