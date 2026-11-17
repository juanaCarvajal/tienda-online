import { Component, input } from '@angular/core';

/**
 * Lente azul con brillo y tres luces LED: la "marca" visual del escáner.
 * Uso: <app-dex-lens /> o <app-dex-lens size="lg" [busy]="cargando()" />
 */
@Component({
  selector: 'app-dex-lens',
  standalone: true,
  template: `
    <div class="lens" [class.lg]="size() === 'lg'" [class.busy]="busy()">
      <span class="glare"></span>
    </div>
    <div class="leds" aria-hidden="true">
      <i class="led r"></i><i class="led y"></i><i class="led g"></i>
    </div>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: flex-start;
      gap: 10px;
      padding-inline: 12px;
    }

    .lens {
      --s: 40px;
      position: relative;
      width: var(--s);
      height: var(--s);
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #b9f3ff 0%, #39d7ff 28%, #1270c9 62%, #0a2f6b 100%);
      border: 3px solid #fff;
      box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.25), 0 0 14px rgba(57, 215, 255, 0.75);
      animation: pulse 2.8s var(--dex-ease) infinite;
    }
    .lens.lg { --s: 84px; border-width: 5px; }
    .lens.busy { animation-duration: 0.7s; }

    .glare {
      position: absolute;
      top: 14%;
      left: 18%;
      width: 34%;
      height: 26%;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.85);
      filter: blur(1px);
    }

    .leds { display: flex; gap: 6px; padding-top: 2px; }
    .led {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1.5px solid rgba(0, 0, 0, 0.35);
      animation: blink 3.6s var(--dex-ease) infinite;
    }
    .led.r { background: #ff5a5a; animation-delay: 0s; }
    .led.y { background: var(--dex-amber); animation-delay: 0.4s; }
    .led.g { background: var(--dex-lime); animation-delay: 0.8s; }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 3px rgba(0,0,0,.25), 0 0 10px rgba(57,215,255,.55); filter: brightness(1); }
      50%      { box-shadow: 0 0 0 3px rgba(0,0,0,.25), 0 0 26px rgba(57,215,255,.95); filter: brightness(1.15); }
    }
    @keyframes blink {
      0%, 70%, 100% { opacity: 1; filter: brightness(1); }
      80%           { opacity: .45; filter: brightness(.7); }
    }
  `,
})
export class DexLensComponent {
  readonly size = input<'sm' | 'lg'>('sm');
  readonly busy = input(false);
}
