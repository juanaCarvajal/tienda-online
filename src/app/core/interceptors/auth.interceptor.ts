import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const withToken = (req: HttpRequest<unknown>, token: string) =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

/**
 * - Bloquea cualquier petición que no sea HTTPS.
 * - Agrega el token de Firebase SOLO a las peticiones hacia un backend propio
 *   (environment.apiUrl). Nunca se envía a TCGdex ni a otros terceros.
 * - Si ese backend responde 401, pide a Firebase un token nuevo y reintenta una vez;
 *   si vuelve a fallar, cierra la sesión.
 * (Firebase Authentication no pasa por aquí: su SDK maneja su propia comunicación.)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (req.url.startsWith('http://')) {
    return throwError(() => new Error(`Petición bloqueada: solo se permite HTTPS (${req.url})`));
  }

  const isOurApi = !!environment.apiUrl && req.url.startsWith(environment.apiUrl);
  if (!isOurApi) return next(req);

  return from(auth.getIdToken()).pipe(
    switchMap((token) => next(token ? withToken(req, token) : req)),
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        return from(auth.getIdToken(true)).pipe(
          switchMap((fresh) => (fresh ? next(withToken(req, fresh)) : throwError(() => err))),
          catchError((e) => {
            auth.logout();
            return throwError(() => e);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
