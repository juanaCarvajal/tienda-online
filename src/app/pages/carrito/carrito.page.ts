import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonThumbnail,
  IonLabel,
  IonButton,
  IonIcon,
  IonFooter,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, addOutline, removeOutline, bagCheckOutline, cartOutline } from 'ionicons/icons';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonThumbnail,
    IonLabel,
    IonButton,
    IonIcon,
    IonFooter,
  ],
  template: `
    <ion-header class="dex-header">
      <ion-toolbar class="dex-shell">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/catalogo" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Carrito ({{ cartService.totalItems() }})</ion-title>
        @if (cartService.items().length > 0) {
          <ion-buttons slot="end">
            <ion-button (click)="confirmClear()">
              <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="dex-screen" style="padding: 16px; min-height: 100%;">
        <span class="dex-label">Carrito</span>

        @if (cartService.items().length === 0) {
          <div class="empty-state">
            <ion-icon name="cart-outline" size="large"></ion-icon>
            <h2>Tu carrito está vacío</h2>
            <p>Explora el catálogo y agrega cartas Pokémon TCG a tu pedido.</p>
            <ion-button routerLink="/catalogo" expand="block">
              Ir al catálogo
            </ion-button>
          </div>
        } @else {
          <ion-list lines="full" style="background: transparent;">
            @for (item of cartService.items(); track item.product.id) {
              <ion-item style="--background: transparent;">
                <ion-thumbnail slot="start">
                  <img
                    [src]="item.product.thumbnail || item.product.image"
                    [alt]="item.product.title"
                    loading="lazy"
                  />
                </ion-thumbnail>
                <ion-label>
                  <h2>{{ item.product.title }}</h2>
                  <p>
                    @if (item.product.price !== null) {
                      {{ item.product.price | currency: item.product.currency }} c/u
                    } @else {
                      Precio no disponible
                    }
                  </p>
                </ion-label>

                <div slot="end" class="qty-controls">
                  <ion-button
                    fill="outline"
                    size="small"
                    (click)="cartService.updateQuantity(item.product.id, item.quantity - 1)"
                  >
                    <ion-icon slot="icon-only" name="remove-outline"></ion-icon>
                  </ion-button>
                  <span class="qty-value">{{ item.quantity }}</span>
                  <ion-button
                    fill="outline"
                    size="small"
                    (click)="cartService.updateQuantity(item.product.id, item.quantity + 1)"
                  >
                    <ion-icon slot="icon-only" name="add-outline"></ion-icon>
                  </ion-button>
                </div>
              </ion-item>
            }
          </ion-list>
        }
      </div>
    </ion-content>

    @if (cartService.items().length > 0) {
      <ion-footer>
        <ion-toolbar class="dex-shell ion-padding-horizontal">
          <div class="checkout-bar">
            <div>
              <small>Total estimado</small>
              @for (t of cartService.totals(); track t.currency) {
                <h3 data-testid="cart-total">{{ t.amount | currency: t.currency }}</h3>
              }
            </div>
            <ion-button color="primary" (click)="checkout()">
              <ion-icon slot="start" name="bag-check-outline"></ion-icon>
              Simular compra
            </ion-button>
          </div>
        </ion-toolbar>
      </ion-footer>
    }
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 55vh;
      text-align: center;
      gap: 0.75rem;
    }
    .qty-controls {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .qty-value {
      min-width: 1.5rem;
      text-align: center;
      font-weight: 600;
    }
    .checkout-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }
    .checkout-bar h3 {
      margin: 0;
      font-weight: 700;
    }
  `],
})
export class CarritoPage {
  readonly cartService = inject(CartService);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ trashOutline, addOutline, removeOutline, bagCheckOutline, cartOutline });
  }

  async confirmClear(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Vaciar carrito',
      message: '¿Deseas eliminar todas las cartas del carrito?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Vaciar',
          role: 'destructive',
          handler: () => this.cartService.clearCart(),
        },
      ],
    });
    await alert.present();
  }

  async checkout(): Promise<void> {
    await this.cartService.clearCart();
    const toast = await this.toastCtrl.create({
      message: 'Pedido simulado con éxito. ¡Gracias por tu compra!',
      duration: 2500,
      color: 'success',
    });
    await toast.present();
  }
}
