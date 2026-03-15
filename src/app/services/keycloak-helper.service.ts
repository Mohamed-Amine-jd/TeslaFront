import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Injectable({ providedIn: 'root' })
export class KeycloakHelperService {

  constructor(private keycloak: KeycloakService) {}

  getUsername(): string {
    return this.keycloak.getKeycloakInstance()
      .tokenParsed?.['preferred_username'] || '';
  }

  getEmail(): string {
    return this.keycloak.getKeycloakInstance()
      .tokenParsed?.['email'] || '';
  }

  getRoles(): string[] {
    return this.keycloak.getUserRoles();
  }

  hasRole(role: string): boolean {
    return this.keycloak.isUserInRole(role);
  }

  logout(): void {
    this.keycloak.logout('http://localhost:4200');
  }

  async getToken(): Promise<string> {
    return await this.keycloak.getToken();
  }
}