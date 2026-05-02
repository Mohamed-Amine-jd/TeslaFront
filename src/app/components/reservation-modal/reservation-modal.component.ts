import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReservationService, Reservation } from '../../services/reservation.service';
import { ChargingStation } from '../../services/charging-station.service';

@Component({
  selector: 'app-reservation-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule, FormsModule, MatInputModule, MatFormFieldModule],
  templateUrl: './reservation-modal.component.html',
  styleUrls: ['./reservation-modal.component.css']
})
export class ReservationModalComponent implements OnInit {
  station: ChargingStation;
  loading = false;
  error: string | null = null;
  reservation: Reservation | null = null;
  reservationCount = 0;
  availableSlots = 0;

  startTime: string = '';
  endTime: string = '';
  startTimeError: string | null = null;
  endTimeError: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ReservationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChargingStation,
    private reservationService: ReservationService
  ) {
    this.station = data;
  }

  ngOnInit() {
    this.loadReservationData();
    this.initializeTimes();
  }

  private initializeTimes() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Start from next minute
    
    const endTimeObj = new Date(now);
    endTimeObj.setHours(endTimeObj.getHours() + 1); // 1 hour duration by default

    this.startTime = this.formatDateTimeLocal(now);
    this.endTime = this.formatDateTimeLocal(endTimeObj);
  }

  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  loadReservationData() {
    this.loading = true;
    this.reservationService.getReservationCount(this.station.id).subscribe(
      (count: number) => {
        this.reservationCount = count;
        this.availableSlots = (this.station.totalSlots || 0) - count;
        this.loading = false;
      },
      (error: any) => {
        console.error('Error loading reservation data:', error);
        this.loading = false;
      }
    );
  }

  validateTimes(): boolean {
    this.startTimeError = null;
    this.endTimeError = null;
    this.error = null;

    if (!this.startTime) {
      this.startTimeError = 'Start time is required.';
      return false;
    }

    if (!this.endTime) {
      this.endTimeError = 'End time is required.';
      return false;
    }

    const startDate = new Date(this.startTime);
    const endDate = new Date(this.endTime);
    const now = new Date();

    if (startDate <= now) {
      this.startTimeError = 'Start time must be in the future.';
      return false;
    }

    if (endDate <= startDate) {
      this.endTimeError = 'End time must be after start time.';
      return false;
    }

    return true;
  }

  reserveStation() {
    if (this.availableSlots <= 0) {
      this.error = 'This station has no available slots.';
      return;
    }

    if (!this.validateTimes()) {
      return;
    }

    this.loading = true;
    this.error = null;

    const startDate = new Date(this.startTime);
    const endDate = new Date(this.endTime);

    this.reservationService.createReservation(this.station.id, this.station.name, startDate, endDate).subscribe(
      (res: Reservation) => {
        this.loading = false;
        this.reservation = res;
      },
      (error: any) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to create reservation. Please try again.';
        console.error('Error creating reservation:', error);
      }
    );
  }

  closeModal() {
    if (this.reservation) {
      this.dialogRef.close(this.reservation);
    } else {
      this.dialogRef.close(null);
    }
  }

  formatTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  }

  calculateDuration(): string {
    if (!this.startTime || !this.endTime) return '';
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  }
}
