import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnalysisResponse {
  success: boolean;
  result: string;
  id: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  // ✅ Port 8081 comme votre backend
  private apiUrl = 'http://localhost:8081/api/gemini';

  constructor(private http: HttpClient) {}

  analyzeImage(file: File): Observable<AnalysisResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<AnalysisResponse>(`${this.apiUrl}/analyze`, formData);
  }

  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history`);
  }
}