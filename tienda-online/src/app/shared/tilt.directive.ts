import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

/**
 * Inclinación 3D + brillo holográfico que sigue al cursor o al dedo.
 * Escribe variables CSS en el elemento:
 *   --rx, --ry  -> rotación en grados
 *   --mx, --my  -> posición del puntero en % (para el brillo)
 *   --glare     -> intensidad del brillo (0 a 1)
 * El CSS de cada página decide cómo usarlas.
 */
@Directive({
  selector: '[appTilt]',
  standalone: true,
  host: { class: 'tilt' },
})
export class TiltDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  /** Grados máximos de inclinación */
  readonly appTilt = input<number | ''>(12);

  private frame = 0;
  private readonly reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  @HostListener('pointermove', ['$event'])
  onMove(e: PointerEvent): void {
    if (this.reduceMotion) return;
    const max = Number(this.appTilt() || 12);
    const host = this.el.nativeElement as HTMLElement;
    const r = host.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      host.style.setProperty('--ry', `${(px - 0.5) * 2 * max}deg`);
      host.style.setProperty('--rx', `${(0.5 - py) * 2 * max}deg`);
      host.style.setProperty('--mx', `${px * 100}%`);
      host.style.setProperty('--my', `${py * 100}%`);
      host.style.setProperty('--glare', '1');
      host.classList.add('tilting');
    });
  }

  @HostListener('pointerleave')
  @HostListener('pointercancel')
  onLeave(): void {
    cancelAnimationFrame(this.frame);
    const host = this.el.nativeElement as HTMLElement;
    host.classList.remove('tilting');
    host.style.setProperty('--rx', '0deg');
    host.style.setProperty('--ry', '0deg');
    host.style.setProperty('--glare', '0');
  }
}
