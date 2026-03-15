import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakHelperService } from '../../services/keycloak-helper.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 30px; font-family: Arial;">

      <h1>🚗 Tesla Project</h1>

      <div style="background: #f5f5f5; padding: 20px; 
                  border-radius: 8px; margin: 20px 0;">
        <h2>Utilisateur connecté</h2>
        <p><strong>Username :</strong> {{ username }}</p>
        <p><strong>Email :</strong> {{ email }}</p>
        <p><strong>Rôles :</strong> {{ roles.join(', ') }}</p>
      </div>

      <button
        (click)="logout()"
        style="background: red; color: white; padding: 10px 20px;
               border: none; border-radius: 5px; cursor: pointer;">
        Se déconnecter
      </button>

    </div>
  `
})
export class HomeComponent implements OnInit {

  username: string = '';
  email: string = '';
  roles: string[] = [];

  constructor(private keycloakHelper: KeycloakHelperService) {}

  ngOnInit(): void {
    this.username = this.keycloakHelper.getUsername();
    this.email    = this.keycloakHelper.getEmail();
    this.roles    = this.keycloakHelper.getRoles();
  }

  logout(): void {
    this.keycloakHelper.logout();
  }
}