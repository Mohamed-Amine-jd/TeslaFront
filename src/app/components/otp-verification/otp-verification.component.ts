import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarteGriseAuthService } from '../../services/carte-grise-auth.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './otp-verification.component.html',
  styleUrl: './otp-verification.component.css'
})
export class OtpVerificationComponent implements OnInit {
  
  matricule = signal<string>('');
  maskedEmail = signal<string>('');
  maskedPhone = signal<string>('');
  selectedMethod = signal<'email' | 'sms' | null>(null);
  otpCode = signal<string[]>(new Array(6).fill(''));
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  constructor(
    private router: Router,
    private authService: CarteGriseAuthService
  ) {
    // Récupération des données passées par le login
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { matricule: string, email: string, phone: string };
    
    if (state) {
      this.matricule.set(state.matricule);
      this.maskedEmail.set(state.email);
      this.maskedPhone.set(state.phone);
    } else {
      // Si on arrive ici sans données (refresh page), retour au login
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {}

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
    this.authService.verifyOtp(this.matricule(), fullCode).subscribe({
      next: (res) => {
        // Transfert du token temporaire vers le token final
        const tempToken = localStorage.getItem('temp_token');
        if (tempToken) localStorage.setItem('kc_token', tempToken);
        
        this.router.navigate(['/home']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set("Code incorrect ou expiré.");
      }
    });
  }
}