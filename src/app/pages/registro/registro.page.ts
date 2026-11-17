import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonInput, IonInputPasswordToggle, IonSpinner } from '@ionic/angular/standalone';
import { AuthService, authErrorMessage } from '../../core/services/auth.service';
import { DexLensComponent } from '../../shared/dex-lens/dex-lens.component';

/** Valida que "contraseña" y "confirmar" sean iguales. */
function samePassword(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value;
  const c = group.get('confirm')?.value;
  return p && c && p !== c ? { mismatch: true } : null;
}

@Component({
  selector: 'app-registro',
  standalone: true,
  templateUrl: './registro.page.html',
  // Reutiliza el diseño de la pantalla de login
  styleUrls: ['../login/login.page.scss'],
  imports: [
    ReactiveFormsModule, RouterLink, IonContent, IonInput, IonInputPasswordToggle, IonButton,
    IonSpinner, DexLensComponent,
  ],
})
export class RegistroPage {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required]],
    },
    { validators: samePassword },
  );

  invalid(name: 'name' | 'email' | 'password' | 'confirm'): boolean {
    const c = this.form.controls[name];
    const mismatch = name === 'confirm' && this.form.hasError('mismatch');
    return c.touched && (c.invalid || mismatch);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      if (this.form.hasError('mismatch')) this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const { name, email, password } = this.form.getRawValue();
      await this.auth.register({ name, email, password });
      await this.router.navigateByUrl('/catalogo', { replaceUrl: true });
    } catch (e) {
      this.error.set(authErrorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
}
