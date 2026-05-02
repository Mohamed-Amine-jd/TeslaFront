import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Reservation {
  id: string;
  userId: string;
  stationId: string;
  stationName: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = 'http://localhost:8081/api/reservations';

  constructor(private http: HttpClient) { }

  createReservation(stationId: string, stationName: string, startTime: Date, endTime: Date): Observable<Reservation> {
    const body = {
      stationId,
      stationName,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };
    return this.http.post<Reservation>(this.apiUrl, body).pipe(
      catchError(error => {
        console.error('Error creating reservation:', error);
        throw error;
      })
    );
  }

  getActiveReservation(): Observable<Reservation | null> {
    return this.http.get<Reservation>(this.apiUrl).pipe(
      map(res => res || null),
      catchError(error => {
        console.error('Error getting active reservation:', error);
        return of(null);
      })
    );
  }

  getReservationCount(stationId: string): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/station/${stationId}`).pipe(
      map(res => res.count),
      catchError(error => {
        console.error('Error getting reservation count:', error);
        return of(0);
      })
    );
  }

  cancelReservation(reservationId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${reservationId}`).pipe(
      catchError(error => {
        console.error('Error cancelling reservation:', error);
        throw error;
      })
    );
  }
}
