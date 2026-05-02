import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, from, switchMap, catchError, of } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private keycloak: KeycloakService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (request.url.includes('/api/public/')) {
      return next.handle(request);
    }

    // Carte grise / password flow stores JWT in localStorage; use it first for our API (Keycloak.getToken() can be empty).
    const stored = localStorage.getItem('kc_token');
    const isLocalBackend =
      request.url.includes('localhost:8081') || request.url.includes('127.0.0.1:8081');
    if (isLocalBackend && stored) {
      return next.handle(
        request.clone({
          setHeaders: { Authorization: `Bearer ${stored}` }
        })
      );
    }

    return from(this.keycloak.getToken()).pipe(
      catchError(() => of(null)),
      switchMap((token) => {
        const finalToken = token || localStorage.getItem('kc_token');
        if (finalToken) {
          const authReq = request.clone({
            setHeaders: { Authorization: `Bearer ${finalToken}` }
          });
          return next.handle(authReq);
        }
        return next.handle(request);
      })
    );
  }
}