import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-foreign-vehicle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './foreign-vehicle.component.html',
  styleUrl: './foreign-vehicle.component.css'
})
export class ForeignVehicleComponent {
  matricule: string | null = null;
  chassis: string | null = null;

  email = '';
  phone = '';

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as any;
    this.matricule = state?.matricule ?? '';
    this.chassis = state?.chassis ?? '';
  }

  cancel(): void {
    this.router.navigate(['/login']);
  }

  sendVerification(): void {
    // Static page: no API call required per request
    // For now, navigate back to login or show a placeholder
    this.router.navigate(['/login']);
  }
}
