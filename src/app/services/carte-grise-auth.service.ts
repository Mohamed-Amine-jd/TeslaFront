import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  private geminiUrl = 'http://localhost:8081/api/public/gemini';

  constructor(private http: HttpClient) {}

  loginWithCarteGrise(file: File): Observable<LoginResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<LoginResponse>(`${this.apiUrl}/login-carte-grise`, formData);
  }

  analyzeImageWithGemini(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.geminiUrl}/analyze`, formData);
  }

  /** Masked email/phone from Mongo client profile (matricule normalized server-side). */
  getUserInfo(matricule: string): Observable<any> {
    const params = new HttpParams().set('matricule', matricule.trim());
    return this.http.get<any>(`${this.apiUrl}/client-contact`, { params });
  }

  sendOtp(matricule: string, method: 'email' | 'sms'): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-otp`, { matricule, method });
  }

  verifyOtp(matricule: string, code: string, chassis?: string): Observable<any> {
    const body: { matricule: string; code: string; chassis?: string } = { matricule, code };
    if (chassis?.trim()) {
      body.chassis = chassis.trim();
    }
    return this.http.post(`${this.apiUrl}/verify-otp`, body);
  }
}