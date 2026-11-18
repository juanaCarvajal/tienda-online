import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInfiniteScroll,
  IonInfiniteScrollContent, IonRefresher, IonRefresherContent, IonSearchbar, IonSelect,
  IonSelectOption, IonTitle, IonToolbar, InfiniteScrollCustomEvent, RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline, logOutOutline, closeCircle, optionsOutline } from 'ionicons/icons';
import { CatalogFilters, Category, Product, ProductPage } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { DexLensComponent } from '../../shared/dex-lens/dex-lens.component';
import { TiltDirective } from '../../shared/tilt.directive';
import { typeColor } from '../../shared/type-colors';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-catalogo',
  standalone: true,
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  imports: [
    CurrencyPipe, RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonBadge, IonContent, IonSearchbar, IonInfiniteScroll, IonInfiniteScrollContent, IonRefresher,
    IonRefresherContent, IonSelect, IonSelectOption, DexLensComponent, TiltDirective,
    ImgFallbackDirective,
  ],
})
export class CatalogoPage implements OnInit {
  private readonly productService = inject(ProductService);
  readonly auth = inject(AuthService);
  readonly cartService = inject(CartService);
  readonly typeColor = typeColor;

  // Datos
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly types = signal<string[]>([]);
  readonly total = signal(0);

  // Filtros
  readonly selectedSet = signal<string | null>(null);
  readonly allSets = signal(false);
  readonly type = signal<string | null>(null);
  readonly name = signal('');
  readonly sort = signal<CatalogFilters['sort']>('default');
  readonly showFilters = signal(true);

  // Estado
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly hasMore = signal(true);

  readonly filters = computed<CatalogFilters>(() => ({
    setId: this.allSets() ? null : this.selectedSet(),
    type: this.type(),
    name: this.name(),
    sort: this.sort(),
  }));

  /** Cantidad de filtros activos (para el indicador y el botón "Limpiar"). */
  readonly activeCount = computed(
    () => (this.type() ? 1 : 0) + (this.name() ? 1 : 0) + (this.sort() !== 'default' ? 1 : 0) + (this.allSets() ? 1 : 0),
  );

  /** "Todas las expansiones" necesita nombre o tipo (si no, serían +20.000 cartas). */
  readonly needsCriteria = computed(() => this.allSets() && !this.type() && this.name().trim().length < 2);

  private page = 1;
  private requestId = 0;

  constructor() {
    addIcons({ cartOutline, logOutOutline, closeCircle, optionsOutline });
  }

  ngOnInit(): void {
    this.productService.getTypes().subscribe((t) => this.types.set(t));
    this.loadCategories();
  }

  private loadCategories(event?: RefresherCustomEvent): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        if (!this.selectedSet() && cats.length) this.selectedSet.set(cats[0].id);
        this.reload(event);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el catálogo. Desliza hacia abajo para reintentar.');
        event?.target.complete();
      },
    });
  }

  // ---------- Eventos de los filtros ----------

  onName(event: CustomEvent): void {
    this.name.set(((event.detail as { value?: string }).value ?? '').trim());
    this.reload();
  }

  onSet(event: CustomEvent): void {
    this.selectedSet.set((event.detail as { value: string }).value);
    this.reload();
  }

  setScope(all: boolean): void {
    if (this.allSets() === all) return;
    this.allSets.set(all);
    this.reload();
  }

  toggleType(t: string): void {
    this.type.set(this.type() === t ? null : t);
    this.reload();
  }

  onSort(event: CustomEvent): void {
    this.sort.set((event.detail as { value: CatalogFilters['sort'] }).value);
    this.reload();
  }

  clearFilters(): void {
    this.type.set(null);
    this.name.set('');
    this.sort.set('default');
    this.allSets.set(false);
    this.reload();
  }

  refresh(event: RefresherCustomEvent): void {
    if (!this.categories().length) this.loadCategories(event);
    else this.reload(event);
  }

  // ---------- Carga ----------

  reload(event?: RefresherCustomEvent): void {
    this.page = 1;
    this.hasMore.set(false);
    this.error.set(null);
    if (this.needsCriteria()) {
      this.products.set([]);
      this.total.set(0);
      this.loading.set(false);
      event?.target.complete();
      return;
    }
    this.loading.set(true);
    const id = ++this.requestId; // descarta respuestas viejas si el usuario cambió de filtro
    this.productService.browse(this.filters(), this.page, PAGE_SIZE).subscribe({
      next: (res) => {
        if (id !== this.requestId) return;
        this.products.set(res.products);
        this.afterPage(res);
        event?.target.complete();
      },
      error: () => {
        if (id !== this.requestId) return;
        this.loading.set(false);
        this.error.set('No se pudo cargar el catálogo. Desliza hacia abajo para reintentar.');
        event?.target.complete();
      },
    });
  }

  loadMore(event: InfiniteScrollCustomEvent): void {
    const id = this.requestId;
    this.productService.browse(this.filters(), this.page, PAGE_SIZE).subscribe({
      next: (res) => {
        if (id === this.requestId) {
          this.products.update((list) => [...list, ...res.products]);
          this.afterPage(res);
        }
        event.target.complete();
      },
      error: () => event.target.complete(),
    });
  }

  private afterPage(res: ProductPage): void {
    this.page++;
    this.total.set(res.total);
    this.hasMore.set(res.hasMore);
    this.loading.set(false);
  }
}
