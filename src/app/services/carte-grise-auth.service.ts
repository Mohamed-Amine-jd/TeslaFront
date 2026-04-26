import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginResponse {
  success:    boolean;
  matricule?: string;
  chassis?:   string;
  token?:     string;
  error?:     string;
}

@Injectable({ providedIn: 'root' })
export class CarteGriseAuthService {

  private apiUrl = 'http://localhost:8081/api/public';

  constructor(private http: HttpClient) {}

  loginWithCarteGrise(file: File): Observable<LoginResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login-carte-grise`,
      formData
    );
  }
}