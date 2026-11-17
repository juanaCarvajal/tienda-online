import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
} from '@ionic/angular/standalone';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
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
    CurrencyPipe, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
    DexLensComponent, TiltDirective, ImgFallbackDirective,
  ],
})
export class ProductoDetallePage implements OnInit {
  private readonly productService = inject(ProductService);

  /** Viene del parámetro de ruta /producto/:id (withComponentInputBinding). */
  readonly id = input.required<string>();

  readonly product = signal<Product | null>(null);
  readonly error = signal<string | null>(null);

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

  readonly typeColor = typeColor;

  /** Porcentaje de la barra de PS (las cartas llegan hasta ~340 PS) */
  hpPercent(hp: number): number {
    return Math.min(100, Math.round((hp / 340) * 100));
  }
}
