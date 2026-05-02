import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface ChargingStationCoordinates {
  lat: number;
  lng: number;
}

export interface ChargingStation {
  id: string;
  name: string;
  coordinates: ChargingStationCoordinates;
  totalSlots: number;
  availableSlots: number;
  power: number;
}

const FALLBACK_STATIONS: ChargingStation[] = [
  { id: '1', name: 'Tesla Tunis', coordinates: { lat: 36.8065, lng: 10.1815 }, totalSlots: 12, availableSlots: 8, power: 150 },
  { id: '2', name: 'Tesla Lac', coordinates: { lat: 36.8456, lng: 10.2510 }, totalSlots: 10, availableSlots: 6, power: 180 },
  { id: '3', name: 'Tesla Marsa', coordinates: { lat: 36.8782, lng: 10.3242 }, totalSlots: 8, availableSlots: 5, power: 120 },
  { id: '4', name: 'Tesla Sousse', coordinates: { lat: 35.8256, lng: 10.6084 }, totalSlots: 14, availableSlots: 9, power: 180 },
  { id: '5', name: 'Tesla Sfax', coordinates: { lat: 34.7406, lng: 10.7603 }, totalSlots: 16, availableSlots: 11, power: 250 },
  { id: '6', name: 'Tesla Monastir', coordinates: { lat: 35.7770, lng: 10.8262 }, totalSlots: 9, availableSlots: 4, power: 120 },
  { id: '7', name: 'Tesla Bizerte', coordinates: { lat: 37.2746, lng: 9.8739 }, totalSlots: 10, availableSlots: 7, power: 150 },
  { id: '8', name: 'Tesla Gabes', coordinates: { lat: 33.8815, lng: 10.0982 }, totalSlots: 12, availableSlots: 8, power: 180 },
  { id: '9', name: 'Tesla Djerba', coordinates: { lat: 33.8076, lng: 10.8451 }, totalSlots: 8, availableSlots: 5, power: 120 }
];

@Injectable({ providedIn: 'root' })
export class ChargingStationService {
  private readonly apiUrl = 'http://localhost:8081/api/public/charging-stations';

  constructor(private http: HttpClient) {}

  getStations(): Observable<ChargingStation[]> {
    return this.http.get<ChargingStation[]>(this.apiUrl).pipe(
      catchError(() => of(FALLBACK_STATIONS))
    );
  }
}