import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { User } from '../models/user.model';

const ACCESS_KEY = 'auth.accessToken';
const REFRESH_KEY = 'auth.refreshToken';
const USER_KEY = 'auth.user';

/**
 * Guarda la sesión en el almacenamiento nativo de Capacitor (Preferences).
 * En Android esto usa SharedPreferences privadas de la app, que otras apps
 * no pueden leer. Se evita localStorage para el token porque es accesible
 * desde cualquier script que corra en el WebView.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  async saveSession(accessToken: string, refreshToken: string, user: User): Promise<void> {
    await Promise.all([
      Preferences.set({ key: ACCESS_KEY, value: accessToken }),
      Preferences.set({ key: REFRESH_KEY, value: refreshToken }),
      Preferences.set({ key: USER_KEY, value: JSON.stringify(user) }),
    ]);
  }

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      Preferences.set({ key: ACCESS_KEY, value: accessToken }),
      Preferences.set({ key: REFRESH_KEY, value: refreshToken }),
    ]);
  }

  async getAccessToken(): Promise<string | null> {
    return (await Preferences.get({ key: ACCESS_KEY })).value;
  }

  async getRefreshToken(): Promise<string | null> {
    return (await Preferences.get({ key: REFRESH_KEY })).value;
  }

  async getUser(): Promise<User | null> {
    const { value } = await Preferences.get({ key: USER_KEY });
    if (!value) return null;
    try {
      return JSON.parse(value) as User;
    } catch {
      return null;
    }
  }

  /** Borra solo los datos de sesión (no el carrito ni otras preferencias). */
  async clear(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: ACCESS_KEY }),
      Preferences.remove({ key: REFRESH_KEY }),
      Preferences.remove({ key: USER_KEY }),
    ]);
  }
}
