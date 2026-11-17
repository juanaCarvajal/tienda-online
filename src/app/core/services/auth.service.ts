import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Auth, GoogleAuthProvider, User as FbUser, browserPopupRedirectResolver,
  createUserWithEmailAndPassword, indexedDBLocalPersistence, initializeAuth,
  onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup,
  signOut, updateProfile,
} from 'firebase/auth';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, User } from '../models/user.model';

/**
 * Autenticación con Firebase Authentication.
 *  - Registro e inicio de sesión con correo y contraseña.
 *  - Inicio de sesión con Google (en navegador; en Android requiere plugin nativo).
 *  - Recuperación de contraseña por correo.
 *
 * Firebase guarda la sesión en IndexedDB (almacenamiento privado del WebView de la app)
 * y renueva el token automáticamente: no se manejan tokens a mano.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);

  /** true si environment.firebase ya tiene la configuración real. */
  readonly configured = !Object.values(environment.firebase).some((v) => v.includes('PEGAR_AQUI'));

  /** Google con popup solo funciona en navegador, no dentro del APK. */
  readonly googleAvailable = !Capacitor.isNativePlatform();

  private readonly app: FirebaseApp | null;
  private readonly auth: Auth | null;

  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.user() !== null);

  constructor() {
    if (this.configured) {
      this.app = initializeApp(environment.firebase);
      this.auth = initializeAuth(this.app, {
        persistence: indexedDBLocalPersistence,
        popupRedirectResolver: this.googleAvailable ? browserPopupRedirectResolver : undefined,
      });
      this.auth.languageCode = 'es';
      onAuthStateChanged(this.auth, (u) => this.user.set(u ? this.toUser(u) : null));
    } else {
      this.app = null;
      this.auth = null;
      console.warn('[Auth] Firebase no está configurado: completa environment.firebase');
    }
  }

  /** Se ejecuta al arrancar la app (app.config.ts): espera a que Firebase restaure la sesión. */
  async restoreSession(): Promise<void> {
    if (!this.auth) return;
    await this.auth.authStateReady();
    this.user.set(this.auth.currentUser ? this.toUser(this.auth.currentUser) : null);
  }

  /** Token de Firebase para un backend propio (lo usa el interceptor). */
  async getIdToken(forceRefresh = false): Promise<string | null> {
    return (await this.auth?.currentUser?.getIdToken(forceRefresh)) ?? null;
  }

  async login({ email, password }: LoginRequest): Promise<User> {
    const cred = await signInWithEmailAndPassword(this.requireAuth(), email.trim(), password);
    return this.setUser(cred.user);
  }

  async register({ name, email, password }: RegisterRequest): Promise<User> {
    const cred = await createUserWithEmailAndPassword(this.requireAuth(), email.trim(), password);
    await updateProfile(cred.user, { displayName: name.trim() });
    await cred.user.reload();
    return this.setUser(this.requireAuth().currentUser ?? cred.user);
  }

  async loginWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(this.requireAuth(), provider);
    return this.setUser(cred.user);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.requireAuth(), email.trim());
  }

  async logout(): Promise<void> {
    if (this.auth) await signOut(this.auth);
    this.user.set(null);
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private requireAuth(): Auth {
    if (!this.auth) {
      throw Object.assign(new Error('Firebase no configurado'), { code: 'app/not-configured' });
    }
    return this.auth;
  }

  private setUser(u: FbUser): User {
    const user = this.toUser(u);
    this.user.set(user);
    return user;
  }

  private toUser(u: FbUser): User {
    const name = (u.displayName ?? u.email?.split('@')[0] ?? 'Entrenador').trim();
    const [firstName, ...rest] = name.split(/\s+/);
    return {
      id: u.uid,
      email: u.email ?? '',
      firstName,
      lastName: rest.join(' '),
      image: u.photoURL ?? this.avatar(name),
      provider: u.providerData[0]?.providerId ?? 'password',
      emailVerified: u.emailVerified,
    };
  }

  /** Avatar SVG con las iniciales (sin servicios externos). */
  private avatar(name: string): string {
    const initials = name.split(/\s+/).map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1a2634"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="26" font-weight="700" fill="#39d7ff">${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}

/** Traduce los códigos de error de Firebase a mensajes en español. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
    'auth/network-request-failed': 'Sin conexión a internet. Revisa tu red e intenta de nuevo.',
    'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de terminar.',
    'auth/cancelled-popup-request': 'Se cerró la ventana de Google antes de terminar.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permite ventanas emergentes.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase (Authentication → Settings → Authorized domains).',
    'auth/operation-not-allowed': 'Este método de inicio de sesión no está activado en Firebase.',
    'app/not-configured': 'Falta configurar Firebase en src/environments/environment.ts.',
  };
  return map[code] ?? 'Ocurrió un error inesperado. Intenta de nuevo.';
}
