import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CatalogFilters, Category, Product, ProductPage, TcgCard, TcgCardResume, TcgSet, TcgSetResume,
} from '../models/product.model';

/** Tipos de energía por si la API no responde la lista. */
const FALLBACK_TYPES = [
  'Planta', 'Fuego', 'Agua', 'Rayo', 'Psíquico', 'Lucha', 'Oscuridad', 'Metal', 'Dragón', 'Hada', 'Incoloro',
];

/** Minúsculas y sin tildes, para comparar nombres ("Pokémon" == "pokemon"). */
const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Catálogo de la tienda: cartas Pokémon TCG desde la API pública TCGdex.
 * Documentación: https://tcgdex.dev  (no requiere API key, funciona por HTTPS)
 *
 * Endpoints usados:
 *   GET /v2/{lang}/sets                -> expansiones
 *   GET /v2/{lang}/sets/{id}           -> cartas de una expansión
 *   GET /v2/{lang}/types               -> tipos de energía
 *   GET /v2/{lang}/types/{tipo}        -> todas las cartas de un tipo
 *   GET /v2/{lang}/cards?name=...      -> búsqueda por nombre en todo el catálogo
 *   GET /v2/{lang}/cards/{id}          -> detalle + precios de mercado
 *
 * Los filtros se combinan así:
 *   1. Se parte de la expansión elegida (o, si es "todas", de la búsqueda por nombre o por tipo).
 *   2. Si hay tipo, se cruza con la lista de cartas de ese tipo.
 *   3. Si hay nombre, se filtra por nombre (sin importar tildes ni mayúsculas).
 *   4. Se ordena y se pagina; solo se pide el detalle (precio) de las cartas de la página.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.catalogUrl}/${environment.catalogLang}`;

  /** Cache en memoria para no repetir peticiones. */
  private readonly listCache = new Map<string, Observable<TcgCardResume[]>>();
  private readonly cardCache = new Map<string, Observable<Product>>();
  private categories$?: Observable<Category[]>;
  private types$?: Observable<string[]>;

  /** Expansiones, de la más reciente a la más antigua. */
  getCategories(): Observable<Category[]> {
    this.categories$ ??= this.http.get<TcgSetResume[]>(`${this.api}/sets`).pipe(
      map((sets) =>
        sets
          .filter((s) => (s.cardCount?.total ?? 1) > 0)
          .reverse()
          .map((s) => ({ id: s.id, name: s.name, logo: s.logo, total: s.cardCount?.total })),
      ),
      shareReplay(1),
    );
    return this.categories$;
  }

  /** Tipos de energía (Fuego, Agua, ...). */
  getTypes(): Observable<string[]> {
    this.types$ ??= this.http.get<string[]>(`${this.api}/types`).pipe(
      map((t) => (Array.isArray(t) && t.length ? t : FALLBACK_TYPES)),
      catchError(() => of(FALLBACK_TYPES)),
      shareReplay(1),
    );
    return this.types$;
  }

  /** Catálogo filtrado, ordenado y paginado. */
  browse(f: CatalogFilters, page = 1, pageSize = 20): Observable<ProductPage> {
    const typeIds$: Observable<Set<string> | null> = f.type ? this.typeIds(f.type) : of(null);
    return this.baseList(f).pipe(
      switchMap((base) =>
        typeIds$.pipe(
          map((typeIds): TcgCardResume[] => {
            let list = base.filter((c) => !!c.image);
            if (typeIds) list = list.filter((c) => typeIds.has(c.id));
            const q = normalize(f.name);
            if (q) list = list.filter((c) => normalize(c.name).includes(q));
            return this.sort(list, f.sort);
          }),
        ),
      ),
      switchMap((list: TcgCardResume[]) => {
        const start = (page - 1) * pageSize;
        const slice = list.slice(start, start + pageSize);
        return this.withDetails(slice).pipe(
          map((products) => ({ products, hasMore: start + pageSize < list.length, total: list.length })),
        );
      }),
    );
  }

  /** Detalle completo de una carta, con precio. */
  getProduct(id: string): Observable<Product> {
    if (!this.cardCache.has(id)) {
      this.cardCache.set(
        id,
        this.http.get<TcgCard>(`${this.api}/cards/${encodeURIComponent(id)}`).pipe(
          map((c) => this.toProduct(c)),
          shareReplay(1),
        ),
      );
    }
    return this.cardCache.get(id)!;
  }

  // ---------------------------------------------------------------------------

  /** Lista de partida según la expansión o, en "todas", según nombre o tipo. */
  private baseList(f: CatalogFilters): Observable<TcgCardResume[]> {
    if (f.setId) return this.cached(`set:${f.setId}`, () =>
      this.http.get<TcgSet>(`${this.api}/sets/${encodeURIComponent(f.setId!)}`).pipe(map((s) => s.cards ?? [])));

    const q = f.name.trim();
    if (q.length >= 2) return this.cached(`name:${normalize(q)}`, () =>
      this.http.get<TcgCardResume[]>(`${this.api}/cards`, { params: new HttpParams().set('name', q) }));

    if (f.type) return this.typeList(f.type);

    // "Todas las expansiones" sin nombre ni tipo: serían más de 20.000 cartas.
    return of([]);
  }

  private typeList(type: string): Observable<TcgCardResume[]> {
    return this.cached(`type:${type}`, () =>
      this.http.get<{ cards?: TcgCardResume[] }>(`${this.api}/types/${encodeURIComponent(type)}`).pipe(
        map((r) => r.cards ?? []),
      ));
  }

  private typeIds(type: string): Observable<Set<string>> {
    return this.typeList(type).pipe(map((cards) => new Set(cards.map((c) => c.id))));
  }

  private cached(key: string, factory: () => Observable<TcgCardResume[]>): Observable<TcgCardResume[]> {
    if (!this.listCache.has(key)) {
      const obs = factory().pipe(shareReplay(1));
      // Si falla, se borra de la cache para poder reintentar.
      this.listCache.set(key, obs.pipe(catchError((e) => {
        this.listCache.delete(key);
        throw e;
      })));
    }
    return this.listCache.get(key)!;
  }

  private sort(list: TcgCardResume[], sort: CatalogFilters['sort']): TcgCardResume[] {
    const byName = (a: TcgCardResume, b: TcgCardResume) => a.name.localeCompare(b.name, 'es');
    switch (sort) {
      case 'name-asc': return [...list].sort(byName);
      case 'name-desc': return [...list].sort((a, b) => byName(b, a));
      default: return list; // orden de la API (número de carta dentro de la expansión)
    }
  }

  /**
   * El listado de TCGdex solo trae id, nombre e imagen. Para mostrar precio y rareza
   * se pide el detalle de cada carta de la página en paralelo.
   * Si alguna falla, se muestra igual pero sin precio.
   */
  private withDetails(cards: TcgCardResume[]): Observable<Product[]> {
    if (!cards.length) return of([]);
    return forkJoin(
      cards.map((c) => this.getProduct(c.id).pipe(catchError(() => of(this.toProduct(c))))),
    );
  }

  private toProduct(c: TcgCard): Product {
    const { price, currency, source } = this.extractPrice(c);
    // Algunas cartas no tienen imagen en español: se prepara la URL en inglés como respaldo.
    const lang = environment.catalogLang;
    const en = c.image && lang !== 'en' ? c.image.replace(`/${lang}/`, '/en/') : undefined;
    return {
      id: c.id,
      title: c.name,
      thumbnail: `${c.image}/low.webp`,
      image: `${c.image}/high.webp`,
      thumbnailEn: en && `${en}/low.webp`,
      imageEn: en && `${en}/high.webp`,
      setName: c.set?.name,
      number: c.localId,
      rarity: c.rarity,
      category: c.category,
      hp: c.hp,
      types: c.types,
      illustrator: c.illustrator,
      description: c.description ?? c.effect,
      attacks: c.attacks,
      price,
      currency,
      priceSource: source,
    };
  }

  /**
   * Precio de referencia:
   * 1) Cardmarket (EUR): promedio de venta, o tendencia, o precio más bajo.
   * 2) Si no hay, TCGPlayer (USD): primer variante con precio de mercado.
   */
  private extractPrice(c: TcgCard): {
    price: number | null; currency: 'EUR' | 'USD'; source?: 'Cardmarket' | 'TCGPlayer';
  } {
    const round = (n: number) => Math.round(n * 100) / 100;
    const cm = c.pricing?.cardmarket;
    const cmPrice = [cm?.avg, cm?.trend, cm?.low].find((v) => typeof v === 'number' && v > 0);
    if (typeof cmPrice === 'number') {
      return { price: round(cmPrice), currency: 'EUR', source: 'Cardmarket' };
    }
    const tp = c.pricing?.tcgplayer;
    if (tp) {
      for (const variant of Object.values(tp)) {
        if (variant && typeof variant === 'object') {
          const v = variant as Record<string, unknown>;
          const n = [v['marketPrice'], v['midPrice'], v['lowPrice']]
            .find((x) => typeof x === 'number' && (x as number) > 0) as number | undefined;
          if (n) return { price: round(n), currency: 'USD', source: 'TCGPlayer' };
        }
      }
    }
    return { price: null, currency: 'EUR' };
  }
}
