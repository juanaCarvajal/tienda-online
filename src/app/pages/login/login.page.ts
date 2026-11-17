import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IonButton, IonContent, IonInput, IonInputPasswordToggle, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { DexLensComponent } from '../../shared/dex-lens/dex-lens.component';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    ReactiveFormsModule, IonContent, IonInput, IonInputPasswordToggle, IonButton, IonSpinner,
    DexLensComponent,
  ],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.form.reset();
        this.router.navigateByUrl('/catalogo', { replaceUrl: true });
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.messageFor(err));
      },
    });
  }

  private messageFor(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'Sin conexión a internet. Revisa tu red e intenta de nuevo.';
      if (err.status === 400 || err.status === 401) return 'Usuario o contraseña incorrectos.';
      return `Error del servidor (${err.status}). Intenta más tarde.`;
    }
    return 'Ocurrió un error inesperado.';
  }
}
