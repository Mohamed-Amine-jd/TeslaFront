import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CarteGriseAuthService } from '../../services/carte-grise-auth.service';

/** Router.navigate(..., { state }) is readable here after navigation completes */
type OtpNavState = {
  matricule?: string;
  chassis?: string;
  email?: string;
  phone?: string;
  navigationId?: number;
};

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './otp-verification.component.html',
  styleUrl: './otp-verification.component.css'
})
export class OtpVerificationComponent implements OnInit {
  
  matricule = signal<string>('');
  chassis = signal<string>('');
  maskedEmail = signal<string>('');
  maskedPhone = signal<string>('');
  selectedMethod = signal<'email' | 'sms' | null>(null);
  otpCode = signal<string[]>(new Array(6).fill(''));
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  constructor(
    private router: Router,
    private authService: CarteGriseAuthService
  ) {}

  ngOnInit(): void {
    const state = history.state as OtpNavState;
    if (!state?.matricule) {
      void this.router.navigate(['/login']);
      return;
    }
    this.matricule.set(state.matricule);
    if (state.chassis) this.chassis.set(state.chassis);
    if (state.email) this.maskedEmail.set(state.email);
    if (state.phone) this.maskedPhone.set(state.phone);
  }

  sendOtp(method: 'email' | 'sms') {
    this.selectedMethod.set(method);
    this.authService.sendOtp(this.matricule(), method).subscribe({
      next: () => console.log('OTP envoyé via ' + method),
      error: () => this.errorMessage.set("Erreur lors de l'envoi du code")
    });
  }

  onInput(event: any, index: number) {
    const val = event.target.value;
    if (val.length === 1 && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
    this.otpCode()[index] = val;
  }

  verify() {
    const fullCode = this.otpCode().join('');
    if (fullCode.length < 6) return;

    this.isLoading.set(true);
    this.authService.verifyOtp(this.matricule(), fullCode, this.chassis() || undefined).subscribe({
      next: (res) => {
        if (res?.token) {
          localStorage.setItem('kc_token', res.token);
        } else {
          const tempToken = localStorage.getItem('temp_token');
          if (tempToken) {
            localStorage.setItem('kc_token', tempToken);
          }
        }
        this.router.navigateByUrl('/charging-map', { replaceUrl: true });
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set("Code incorrect ou expiré.");
      }
    });
  }
}