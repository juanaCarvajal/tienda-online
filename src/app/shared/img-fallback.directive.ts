import { Directive, ElementRef, HostListener, effect, inject, input } from '@angular/core';

/**
 * Si una imagen no carga, prueba con las URL de respaldo en orden.
 * Si ninguna funciona, oculta la imagen y agrega la clase "no-img" al elemento padre
 * (el CSS muestra entonces un reverso de carta con "Imagen no disponible").
 *
 * Uso: <img [src]="p.thumbnail" [appImgFallback]="[p.thumbnailEn]" />
 */
@Directive({
  selector: 'img[appImgFallback]',
  standalone: true,
})
export class ImgFallbackDirective {
  private readonly el = inject(ElementRef<HTMLImageElement>);
  readonly appImgFallback = input<(string | undefined)[]>([]);

  private index = 0;

  constructor() {
    // Si la carta cambia (otra página / otro filtro), se reinicia el estado.
    effect(() => {
      this.appImgFallback();
      this.index = 0;
      const img = this.el.nativeElement as HTMLImageElement;
      img.style.visibility = '';
      img.parentElement?.classList.remove('no-img');
    });
  }

  @HostListener('error')
  onError(): void {
    const img = this.el.nativeElement as HTMLImageElement;
    const fallbacks = this.appImgFallback().filter((u): u is string => !!u && u !== img.src);
    if (this.index < fallbacks.length) {
      img.src = fallbacks[this.index++];
      return;
    }
    img.style.visibility = 'hidden';
    img.parentElement?.classList.add('no-img');
  }
}
