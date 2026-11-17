import { Component } from '@angular/core';
import {
  IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
} from '@ionic/angular/standalone';

/**
 * PÁGINA DE RELEVO PARA EL INTEGRANTE 2.
 * La ruta /carrito ya está creada y protegida con authGuard.
 * Aquí se implementa el carrito de compras + almacenamiento local
 * (Capacitor Preferences ya está instalado en el proyecto).
 */
@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent],
  template: `
    <ion-header class="dex-header">
      <ion-toolbar class="dex-shell">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/catalogo" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Carrito</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="dex-screen" style="padding: 16px">
        <span class="dex-label">Carrito</span>
        <p>En desarrollo (Integrante 2).</p>
      </div>
    </ion-content>
  `,
})
export class CarritoPage {}
