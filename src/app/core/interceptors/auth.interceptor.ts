import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const withToken = (req: HttpRequest<unknown>, token: string) =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

/**
 * - Bloquea cualquier petición que no sea HTTPS.
 * - Agrega el token SOLO a las peticiones hacia nuestra API (no se filtra a
 *   terceros como CDNs de imágenes).
 * - Si la API responde 401, intenta renovar el token una vez; si falla,
 *   cierra la sesión.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (req.url.startsWith('http://')) {
    return throwError(() => new Error(`Petición bloqueada: solo se permite HTTPS (${req.url})`));
  }

  const isOurApi = req.url.startsWith(environment.apiUrl);
  const isAuthCall = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
  const token = auth.getAccessToken();

  const request = isOurApi && !isAuthCall && token ? withToken(req, token) : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && isOurApi && !isAuthCall && token) {
        return auth.refresh().pipe(
          switchMap((newToken) => next(withToken(req, newToken))),
          catchError((refreshErr) => {
            auth.logout();
            return throwError(() => refreshErr);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
