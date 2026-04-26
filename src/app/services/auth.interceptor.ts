import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, from, switchMap, of } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private keycloak: KeycloakService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    // D'abord essayer le token Keycloak
    const keycloakInstance = this.keycloak.getKeycloakInstance();

    if (keycloakInstance?.token) {
      console.log('✅ Token Keycloak ajouté');
      const authReq = request.clone({
        setHeaders: { Authorization: `Bearer ${keycloakInstance.token}` }
      });
      return next.handle(authReq);
    }

    // Sinon essayer le token stocké localement
    const localToken = localStorage.getItem('kc_token');
    if (localToken) {
      console.log('✅ Token local ajouté');
      const authReq = request.clone({
        setHeaders: { Authorization: `Bearer ${localToken}` }
      });
      return next.handle(authReq);
    }

    console.log('❌ Pas de token');
    return next.handle(request);
  }
}