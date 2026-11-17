import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Category, Product, ProductPage, TcgCard, TcgCardResume, TcgSet, TcgSetResume,
} from '../models/product.model';

/**
 * Catálogo de la tienda: cartas Pokémon TCG desde la API pública TCGdex.
 * Documentación: https://tcgdex.dev  (no requiere API key, funciona por HTTPS)
 *
 * Endpoints usados:
 *   GET /v2/{lang}/sets                      -> expansiones (categorías)
 *   GET /v2/{lang}/sets/{id}                 -> cartas de una expansión
 *   GET /v2/{lang}/cards?name=...            -> búsqueda por nombre (paginada)
 *   GET /v2/{lang}/cards/{id}                -> detalle + precios de mercado
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.catalogUrl}/${environment.catalogLang}`;

  /** Cache en memoria para no volver a pedir la misma expansión o carta. */
  private readonly setCache = new Map<string, Observable<TcgCardResume[]>>();
  private readonly cardCache = new Map<string, Observable<Product>>();
  private categories$?: Observable<Category[]>;

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

  /** Cartas de una expansión, paginadas en el cliente (la API las entrega todas juntas). */
  getByCategory(setId: string, page = 1, pageSize = 20): Observable<ProductPage> {
    if (!this.setCache.has(setId)) {
      this.setCache.set(
        setId,
        this.http.get<TcgSet>(`${this.api}/sets/${encodeURIComponent(setId)}`).pipe(
          map((s) => (s.cards ?? []).filter((c) => !!c.image)),
          shareReplay(1),
        ),
      );
    }
    return this.setCache.get(setId)!.pipe(
      switchMap((cards) => {
        const start = (page - 1) * pageSize;
        const slice = cards.slice(start, start + pageSize);
        return this.withDetails(slice).pipe(
          map((products) => ({ products, hasMore: start + pageSize < cards.length })),
        );
      }),
    );
  }

  /** Búsqueda por nombre en todo el catálogo (paginada en el servidor). */
  search(query: string, page = 1, pageSize = 20): Observable<ProductPage> {
    const params = new HttpParams()
      .set('name', query)
      .set('pagination:page', page)
      .set('pagination:itemsPerPage', pageSize);
    return this.http.get<TcgCardResume[]>(`${this.api}/cards`, { params }).pipe(
      switchMap((raw) =>
        this.withDetails(raw.filter((c) => !!c.image)).pipe(
          map((products) => ({ products, hasMore: raw.length === pageSize })),
        ),
      ),
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

  /**
   * El listado de TCGdex solo trae id, nombre e imagen. Para mostrar precio y rareza
   * en el catálogo se pide el detalle de cada carta de la página en paralelo.
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
    return {
      id: c.id,
      title: c.name,
      thumbnail: `${c.image}/low.webp`,
      image: `${c.image}/high.webp`,
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
