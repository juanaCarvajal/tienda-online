import { Injectable, computed, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';

const CART_STORAGE_KEY = 'dex_tcg_cart_v1';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();

  readonly totalItems = computed(() =>
    this._items().reduce((acc, item) => acc + item.quantity, 0)
  );

  readonly totalPrice = computed(() =>
    this._items().reduce((acc, item) => {
      const price = item.product.price ?? 0;
      return acc + price * item.quantity;
    }, 0)
  );

  constructor() {
    this.loadCart();
  }

  async loadCart(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: CART_STORAGE_KEY });
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
    try {
      await Preferences.set({
        key: CART_STORAGE_KEY,
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
    await Preferences.remove({ key: CART_STORAGE_KEY });
  }
}