import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
} from '@ionic/angular/standalone';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { DexLensComponent } from '../../shared/dex-lens/dex-lens.component';
import { TiltDirective } from '../../shared/tilt.directive';

/** Color de cada tipo de energía (nombres en español e inglés) */
const TYPE_COLORS: Record<string, string> = {
  fuego: '#ff7b3a', fire: '#ff7b3a',
  agua: '#4fb3ff', water: '#4fb3ff',
  planta: '#6fd36a', grass: '#6fd36a',
  rayo: '#ffd93d', lightning: '#ffd93d',
  'psíquico': '#c77dff', psychic: '#c77dff',
  lucha: '#d9844a', fighting: '#d9844a',
  oscuridad: '#6c7a89', darkness: '#6c7a89',
  metal: '#b8c4cf',
  'dragón': '#d4af37', dragon: '#d4af37',
  hada: '#ff9bd2', fairy: '#ff9bd2',
  incoloro: '#e8e8e8', colorless: '#e8e8e8',
};

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  templateUrl: './producto-detalle.page.html',
  styleUrls: ['./producto-detalle.page.scss'],
  imports: [
    CurrencyPipe, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
    DexLensComponent, TiltDirective,
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

  typeColor(type: string): string {
    return TYPE_COLORS[type.toLowerCase()] ?? '#9fb3c8';
  }

  /** Porcentaje de la barra de PS (las cartas llegan hasta ~340 PS) */
  hpPercent(hp: number): number {
    return Math.min(100, Math.round((hp / 340) * 100));
  }
}
