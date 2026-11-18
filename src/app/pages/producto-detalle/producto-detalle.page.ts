import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline } from 'ionicons/icons';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { DexLensComponent } from '../../shared/dex-lens/dex-lens.component';
import { TiltDirective } from '../../shared/tilt.directive';
import { typeColor } from '../../shared/type-colors';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  templateUrl: './producto-detalle.page.html',
  styleUrls: ['./producto-detalle.page.scss'],
  imports: [
    CurrencyPipe,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonBadge,
    IonContent,
    DexLensComponent,
    TiltDirective,
    ImgFallbackDirective,
  ],
})
export class ProductoDetallePage implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly toastCtrl = inject(ToastController);
  readonly cartService = inject(CartService);

  /** Viene del parámetro de ruta /producto/:id (withComponentInputBinding). */
  readonly id = input.required<string>();

  readonly product = signal<Product | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    addIcons({ cartOutline });
  }

  ngOnInit(): void {
    const id = this.id();
    // Ids de TCGdex: letras, números, puntos y guiones (ej. "sv03.5-025")
    if (!/^[\w.-]{1,40}$/.test(id)) {
      this.error.set('Carta no válida.');
      return;
    }
    this.productService.getProduct(id).subscribe({
      next: (p) => this.product.set(p),
      error: () => this.error.set('No se pudo cargar la carta.'),
    });
  }

  async addToCart(product: Product): Promise<void> {
    await this.cartService.addItem(product, 1);
    const toast = await this.toastCtrl.create({
      message: `${product.title} agregada al carrito`,
      duration: 1800,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  }

  readonly typeColor = typeColor;

  /** Porcentaje de la barra de PS (las cartas llegan hasta ~340 PS) */
  hpPercent(hp: number): number {
    return Math.min(100, Math.round((hp / 340) * 100));
  }
}