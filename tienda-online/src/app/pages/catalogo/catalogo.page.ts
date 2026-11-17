import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInfiniteScroll,
  IonInfiniteScrollContent, IonRefresher, IonRefresherContent, IonSearchbar, IonSelect,
  IonSelectOption, IonTitle, IonToolbar, InfiniteScrollCustomEvent, RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline, logOutOutline } from 'ionicons/icons';
import { Observable } from 'rxjs';
import { Category, Product, ProductPage } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { DexLensComponent } from '../../shared/dex-lens/dex-lens.component';
import { TiltDirective } from '../../shared/tilt.directive';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-catalogo',
  standalone: true,
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  imports: [
    CurrencyPipe, RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonSearchbar, IonInfiniteScroll, IonInfiniteScrollContent, IonRefresher,
    IonRefresherContent, IonSelect, IonSelectOption, DexLensComponent, TiltDirective,
  ],
})
export class CatalogoPage implements OnInit {
  private readonly productService = inject(ProductService);
  readonly auth = inject(AuthService);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly query = signal('');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly hasMore = signal(true);

  private page = 1;

  constructor() {
    addIcons({ cartOutline, logOutOutline });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  /** Carga las expansiones y muestra por defecto la más reciente. */
  private loadCategories(event?: RefresherCustomEvent): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        if (!this.selectedCategory() && cats.length) this.selectedCategory.set(cats[0].id);
        this.reload(event);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el catálogo. Desliza hacia abajo para reintentar.');
        event?.target.complete();
      },
    });
  }

  onSearch(event: CustomEvent): void {
    this.query.set(((event.detail as { value?: string }).value ?? '').trim());
    this.reload();
  }

  onCategoryChange(event: CustomEvent): void {
    this.selectedCategory.set((event.detail as { value: string }).value);
    this.query.set('');
    this.reload();
  }

  refresh(event: RefresherCustomEvent): void {
    if (!this.categories().length) this.loadCategories(event);
    else this.reload(event);
  }

  reload(event?: RefresherCustomEvent): void {
    this.page = 1;
    this.hasMore.set(true);
    this.loading.set(true);
    this.error.set(null);
    this.fetch().subscribe({
      next: (res) => {
        this.products.set(res.products);
        this.afterPage(res);
        event?.target.complete();
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el catálogo. Desliza hacia abajo para reintentar.');
        event?.target.complete();
      },
    });
  }

  loadMore(event: InfiniteScrollCustomEvent): void {
    this.fetch().subscribe({
      next: (res) => {
        this.products.update((list) => [...list, ...res.products]);
        this.afterPage(res);
        event.target.complete();
      },
      error: () => event.target.complete(),
    });
  }

  private fetch(): Observable<ProductPage> {
    const q = this.query();
    if (q) return this.productService.search(q, this.page, PAGE_SIZE);
    return this.productService.getByCategory(this.selectedCategory() ?? '', this.page, PAGE_SIZE);
  }

  private afterPage(res: ProductPage): void {
    this.page++;
    this.hasMore.set(res.hasMore);
    this.loading.set(false);
  }
}
