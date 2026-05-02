import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import * as L from 'leaflet';
import { timer } from 'rxjs';
import { ReservationModalComponent } from '../reservation-modal/reservation-modal.component';
import { ChargingStation, ChargingStationService } from '../../services/charging-station.service';
import { Reservation, ReservationService } from '../../services/reservation.service';

type MapStation = ChargingStation & { distanceKm?: number };
type StationCoordinates = { lat: number; lng: number };

const DEFAULT_STATION_COORDINATES: Record<string, StationCoordinates> = {
  'Tesla Tunis': { lat: 36.8065, lng: 10.1815 },
  'Tesla Lac': { lat: 36.8456, lng: 10.2510 },
  'Tesla Marsa': { lat: 36.8782, lng: 10.3242 },
  'Tesla Sousse': { lat: 35.8256, lng: 10.6084 },
  'Tesla Sfax': { lat: 34.7406, lng: 10.7603 },
  'Tesla Monastir': { lat: 35.7770, lng: 10.8262 },
  'Tesla Bizerte': { lat: 37.2746, lng: 9.8739 },
  'Tesla Gabes': { lat: 33.8815, lng: 10.0982 },
  'Tesla Djerba': { lat: 33.8076, lng: 10.8451 }
};

@Component({
  selector: 'app-charging-map',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './charging-map.component.html',
  styleUrl: './charging-map.component.css'
})
export class ChargingMapComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private readonly destroyRef = inject(DestroyRef);
  private map?: L.Map;
  private stationMarkers: L.Layer[] = [];
  private readonly tunisCenter: L.LatLngExpression = [36.8065, 10.1815];

  stations: MapStation[] = [];
  nearbyStations: MapStation[] = [];
  availableTotal = 0;
  loading = true;
  userLocation: { lat: number; lng: number } | null = null;
  activeReservation: Reservation | null = null;

  constructor(
    private chargingStationService: ChargingStationService,
    private dialog: MatDialog,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.loadStations();
    this.loadActiveReservation();

    timer(0, 15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshStations();
        this.loadActiveReservation();
      });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.updateNearbyStations();
          this.recenterMap();
        },
        () => {
          this.userLocation = { lat: 36.8065, lng: 10.1815 };
          this.updateNearbyStations();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  goToStation(station: MapStation): void {
    if (!this.hasValidCoordinates(station)) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.coordinates.lat},${station.coordinates.lng}`;
    window.open(url, '_blank', 'noopener');
  }

  openReservationModal(station: MapStation): void {
    const dialogRef = this.dialog.open(ReservationModalComponent, {
      width: '450px',
      maxHeight: '600px',
      data: station,
      panelClass: 'reservation-dialog'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loadActiveReservation();
      this.refreshStations();
    });
  }

  focusStation(station: MapStation): void {
    if (!this.map || !this.hasValidCoordinates(station)) return;
    this.map.setView([station.coordinates.lat, station.coordinates.lng], 13, { animate: true });
  }

  focusOnReservedStation(): void {
    if (!this.activeReservation) return;

    const reservedStation = this.stations.find(
      (station) =>
        station.id === this.activeReservation?.stationId ||
        station.name.toLowerCase() === this.activeReservation?.stationName.toLowerCase()
    );

    if (reservedStation) {
      this.focusStation(reservedStation);
    }
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: this.tunisCenter,
      zoom: 7,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    if (this.stations.length) {
      this.renderStations();
    }
  }

  private loadStations(): void {
    this.chargingStationService.getStations().subscribe({
      next: (stations) => {
        this.stations = stations.map((station) => ({ ...station }));
        this.updateStats();
        this.updateNearbyStations();
        this.loading = false;
        this.renderStations();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private refreshStations(): void {
    this.chargingStationService.getStations().subscribe({
      next: (stations) => {
        this.stations = stations.map((station) => ({ ...station }));
        this.updateStats();
        this.updateNearbyStations();
        this.renderStations();
      }
    });
  }

  private loadActiveReservation(): void {
    this.reservationService.getActiveReservation().subscribe((reservation) => {
      this.activeReservation = reservation;
    });
  }

  private updateStats(): void {
    this.availableTotal = this.stations.reduce((sum, station) => sum + station.availableSlots, 0);
  }

  private updateNearbyStations(): void {
    const location = this.userLocation ?? { lat: 36.8065, lng: 10.1815 };

    this.nearbyStations = [...this.stations]
      .filter((station) => this.hasValidCoordinates(station))
      .map((station) => ({
        ...station,
        distanceKm: this.distanceKm(
          location.lat,
          location.lng,
          station.coordinates!.lat,
          station.coordinates!.lng
        )
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, 4);
  }

  private renderStations(): void {
    if (!this.map) return;

    this.stationMarkers.forEach((layer) => layer.remove());
    this.stationMarkers = [];

    const teslaIcon = L.divIcon({
      className: 'tesla-station-icon',
      html: '<div style="width:16px;height:16px;border-radius:999px;background:#e82127;border:2px solid #fff;box-shadow:0 0 0 6px rgba(232,33,39,.18),0 0 18px rgba(232,33,39,.55);"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    this.stations.forEach((station) => {
      if (!this.hasValidCoordinates(station)) return;

      const marker = L.marker([station.coordinates.lat, station.coordinates.lng], { icon: teslaIcon }).addTo(this.map!);
      marker.bindPopup(this.createPopupElement(station), { maxWidth: 260 });
      this.stationMarkers.push(marker);
    });

    if (this.stationMarkers.length) {
      const markerGroup = new L.FeatureGroup(this.stationMarkers as L.Layer[]);
      this.map.fitBounds(markerGroup.getBounds().pad(0.2));
    }
  }

  private createPopupElement(station: MapStation): HTMLElement {
    const div = document.createElement('div');
    div.style.minWidth = '220px';
    div.style.color = '#111';
    div.style.fontFamily = 'Inter, Arial, sans-serif';

    const titleDiv = document.createElement('div');
    titleDiv.style.fontWeight = '700';
    titleDiv.style.marginBottom = '6px';
    titleDiv.textContent = station.name;

    const slotsDiv = document.createElement('div');
    slotsDiv.style.fontSize = '12px';
    slotsDiv.style.marginBottom = '8px';
    slotsDiv.textContent = `${station.availableSlots}/${station.totalSlots} slots available`;

    const powerDiv = document.createElement('div');
    powerDiv.style.fontSize = '12px';
    powerDiv.style.marginBottom = '10px';
    powerDiv.textContent = `Power: ${station.power} kW`;

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.gap = '8px';
    buttonsDiv.style.marginTop = '10px';

    const reserveBtn = document.createElement('button');
    reserveBtn.textContent = 'Reserve';
    reserveBtn.style.padding = '6px 12px';
    reserveBtn.style.background = '#e82127';
    reserveBtn.style.color = '#fff';
    reserveBtn.style.border = 'none';
    reserveBtn.style.borderRadius = '6px';
    reserveBtn.style.fontWeight = '700';
    reserveBtn.style.cursor = 'pointer';
    reserveBtn.style.fontSize = '12px';
    reserveBtn.onclick = (e) => {
      e.stopPropagation();
      this.openReservationModal(station);
    };

    const googleBtn = document.createElement('a');
    googleBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${station.coordinates!.lat},${station.coordinates!.lng}`;
    googleBtn.target = '_blank';
    googleBtn.rel = 'noopener noreferrer';
    googleBtn.textContent = 'Directions';
    googleBtn.style.display = 'inline-block';
    googleBtn.style.padding = '6px 12px';
    googleBtn.style.background = '#333';
    googleBtn.style.color = '#fff';
    googleBtn.style.textDecoration = 'none';
    googleBtn.style.borderRadius = '6px';
    googleBtn.style.fontWeight = '700';
    googleBtn.style.fontSize = '12px';

    buttonsDiv.appendChild(reserveBtn);
    buttonsDiv.appendChild(googleBtn);

    div.appendChild(titleDiv);
    div.appendChild(slotsDiv);
    div.appendChild(powerDiv);
    div.appendChild(buttonsDiv);

    return div;
  }

  private recenterMap(): void {
    if (!this.map || !this.userLocation) return;
    this.map.setView([this.userLocation.lat, this.userLocation.lng], 8);
  }

  private hasValidCoordinates(station: ChargingStation): station is ChargingStation & { coordinates: StationCoordinates } {
    if (station.coordinates && typeof station.coordinates.lat === 'number' && typeof station.coordinates.lng === 'number') {
      return true;
    }

    const fallback = DEFAULT_STATION_COORDINATES[station.name];
    if (fallback) {
      station.coordinates = fallback;
      return true;
    }

    return false;
  }

  private distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(earthRadiusKm * c * 10) / 10;
  }
}
