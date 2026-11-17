import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, map, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RefreshResponse, User } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

/**
 * Autenticación contra DummyJSON (https://dummyjson.com/docs/auth).
 * Usuario de prueba: emilys / emilyspass
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);
  private readonly router = inject(Router);
  private readonly api = environment.apiUrl;

  // El token se mantiene en memoria para no leer el disco en cada petición.
  private readonly accessToken = signal<string | null>(null);
  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.accessToken() !== null);

  /** Se ejecuta al arrancar la app (ver app.config.ts) para restaurar la sesión. */
  async restoreSession(): Promise<void> {
    const [token, user] = await Promise.all([
      this.storage.getAccessToken(),
      this.storage.getUser(),
    ]);
    this.accessToken.set(token);
    this.user.set(user);
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  login(credentials: LoginRequest): Observable<User> {
    const body = {
      username: credentials.username.trim(),
      password: credentials.password,
      expiresInMins: environment.tokenExpiresInMins,
    };
    return this.http.post<LoginResponse>(`${this.api}/auth/login`, body).pipe(
      switchMap((res) => {
        const { accessToken, refreshToken, ...user } = res;
        return from(this.storage.saveSession(accessToken, refreshToken, user)).pipe(
          tap(() => {
            this.accessToken.set(accessToken);
            this.user.set(user);
          }),
          map(() => user),
        );
      }),
    );
  }

  /** Valida el token contra el servidor y actualiza los datos del usuario. */
  me(): Observable<User> {
    return this.http.get<User>(`${this.api}/auth/me`).pipe(tap((u) => this.user.set(u)));
  }

  /** Pide un accessToken nuevo usando el refreshToken guardado. */
  refresh(): Observable<string> {
    return from(this.storage.getRefreshToken()).pipe(
      switchMap((refreshToken) => {
        if (!refreshToken) throw new Error('No hay refreshToken');
        return this.http.post<RefreshResponse>(`${this.api}/auth/refresh`, {
          refreshToken,
          expiresInMins: environment.tokenExpiresInMins,
        });
      }),
      switchMap((res) =>
        from(this.storage.saveTokens(res.accessToken, res.refreshToken)).pipe(
          tap(() => this.accessToken.set(res.accessToken)),
          map(() => res.accessToken),
        ),
      ),
    );
  }

  async logout(): Promise<void> {
    await this.storage.clear();
    this.accessToken.set(null);
    this.user.set(null);
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
