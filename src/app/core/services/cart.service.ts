import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';
import { AuthService } from './auth.service';

/** Prefijo de la clave; cada usuario guarda su carrito en `dex_tcg_cart_v2_<uid>`. */
const CART_STORAGE_PREFIX = 'dex_tcg_cart_v2';
/** Clave anterior (compartida por todos los usuarios), se elimina al iniciar. */
const LEGACY_STORAGE_KEY = 'dex_tcg_cart_v1';

export interface CurrencyTotal {
  currency: Product['currency'];
  amount: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly auth = inject(AuthService);
  private readonly _items = signal<CartItem[]>([]);
  /** Clave del usuario actual; null cuando no hay sesión (no se guarda nada). */
  private storageKey: string | null = null;

  readonly items = this._items.asReadonly();

  readonly totalItems = computed(() =>
    this._items().reduce((acc, item) => acc + item.quantity, 0)
  );

  /**
   * Total agrupado por moneda (ERR-02): las cartas con precio de Cardmarket están en EUR
   * y las de TCGPlayer en USD, por lo que no se pueden sumar en un solo valor.
   */
  readonly totals = computed<CurrencyTotal[]>(() => {
    const map = new Map<Product['currency'], number>();
    for (const item of this._items()) {
      if (item.product.price === null || item.product.price === undefined) continue;
      const prev = map.get(item.product.currency) ?? 0;
      map.set(item.product.currency, prev + item.product.price * item.quantity);
    }
    return [...map.entries()].map(([currency, amount]) => ({
      currency,
      amount: Math.round(amount * 100) / 100,
    }));
  });

  constructor() {
    void Preferences.remove({ key: LEGACY_STORAGE_KEY }).catch(() => undefined);
    // ERR-01: el carrito se asocia al usuario autenticado y cambia cuando cambia la sesión.
    effect(() => {
      const uid = this.auth.user()?.id ?? null;
      untracked(() => void this.switchUser(uid));
    });
  }

  private async switchUser(uid: string | null): Promise<void> {
    const key = uid ? `${CART_STORAGE_PREFIX}_${uid}` : null;
    if (key === this.storageKey) return;
    this.storageKey = key;
    this._items.set([]);
    if (key) await this.loadCart();
  }

  async loadCart(): Promise<void> {
    const key = this.storageKey;
    if (!key) return;
    try {
      const { value } = await Preferences.get({ key });
      if (key !== this.storageKey) return; // la sesión cambió mientras se leía
      if (value) {
        const parsed: CartItem[] = JSON.parse(value);
        this._items.set(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error al cargar el carrito:', error);
      this._items.set([]);
    }
  }

  private async saveCart(): Promise<void> {
    if (!this.storageKey) return;
    try {
      await Preferences.set({
        key: this.storageKey,
        value: JSON.stringify(this._items()),
      });
    } catch (error) {
      console.error('Error al guardar el carrito:', error);
    }
  }

  async addItem(product: Product, quantity = 1): Promise<void> {
    this._items.update((current) => {
      const index = current.findIndex((i) => i.product.id === product.id);
      if (index > -1) {
        const updated = [...current];
        updated[index] = {
          ...updated[index],
          quantity: updated[index].quantity + quantity,
        };
        return updated;
      }
      return [...current, { product, quantity }];
    });
    await this.saveCart();
  }

  async updateQuantity(productId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeItem(productId);
      return;
    }

    this._items.update((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
    await this.saveCart();
  }

  async removeItem(productId: string): Promise<void> {
    this._items.update((current) =>
      current.filter((item) => item.product.id !== productId)
    );
    await this.saveCart();
  }

  async clearCart(): Promise<void> {
    this._items.set([]);
    if (this.storageKey) await Preferences.remove({ key: this.storageKey });
  }
}
