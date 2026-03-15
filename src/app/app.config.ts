import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { routes } from './app.routes';
import { KeycloakService } from 'keycloak-angular';
import { AuthInterceptor } from './interceptors/auth.interceptor';

function initKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'http://localhost:9090',
        realm: 'my-tesla-realm',
        clientId: 'angular-app'
      },
      initOptions: {
        onLoad: 'login-required',
        checkLoginIframe: false
      }
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initKeycloak,
      deps: [KeycloakService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi())
  ]
};