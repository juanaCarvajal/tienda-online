import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonInput, IonInputPasswordToggle, IonSpinner } from '@ionic/angular/standalone';
import { AuthService, authErrorMessage } from '../../core/services/auth.service';
import { DexLensComponent } from '../../shared/dex-lens/dex-lens.component';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    ReactiveFormsModule, RouterLink, IonContent, IonInput, IonInputPasswordToggle, IonButton,
    IonSpinner, DexLensComponent,
  ],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    await this.run(() => this.auth.login(this.form.getRawValue()));
  }

  async google(): Promise<void> {
    if (this.loading()) return;
    await this.run(() => this.auth.loginWithGoogle());
  }

  async forgot(): Promise<void> {
    const email = this.form.controls.email;
    if (email.invalid) {
      email.markAsTouched();
      this.error.set('Escribe tu correo arriba para enviarte el enlace de recuperación.');
      return;
    }
    this.error.set(null);
    try {
      await this.auth.resetPassword(email.value);
      this.info.set(`Si existe una cuenta con ${email.value}, te llegará un correo para restablecer la contraseña.`);
    } catch (e) {
      this.error.set(authErrorMessage(e));
    }
  }

  private async run(action: () => Promise<unknown>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.info.set(null);
    try {
      await action();
      this.form.reset();
      await this.router.navigateByUrl('/catalogo', { replaceUrl: true });
    } catch (e) {
      this.error.set(authErrorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
}
