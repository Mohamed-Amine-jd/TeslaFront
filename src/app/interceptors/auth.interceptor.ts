import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private keycloak: KeycloakService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return from(this.keycloak.getToken()).pipe(
      switchMap(token => {
        if (token) {
          console.log('✅ Token ajouté à la requête');
          const authReq = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next.handle(authReq);
        }
        console.log('❌ Pas de token disponible');
        return next.handle(request);
      })
    );
  }
}