import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface LoginResponse {
  success: boolean;
  matricule?: string;
  chassis?: string;
  token?: string;
  email?: string; // Email masqué : med***@gmail.com
  phone?: string; // Phone masqué : +216****29
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class CarteGriseAuthService {
  private apiUrl = 'http://localhost:8081/api/public';

  constructor(private http: HttpClient) {}

  loginWithCarteGrise(file: File): Observable<LoginResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<LoginResponse>(`${this.apiUrl}/login-carte-grise`, formData);
  }

  sendOtp(matricule: string, method: 'email' | 'sms'): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-otp`, { matricule, method });
  }

  verifyOtp(matricule: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, { matricule, code });
  }
}