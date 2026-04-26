import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarteGriseAuthService } from '../../services/carte-grise-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  selectedFile   = signal<File | null>(null);
  previewUrl     = signal<string | null>(null);
  isLoading      = signal(false);
  errorMessage   = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isDragOver     = signal(false);
  extractedData  = signal<{matricule: string, chassis: string} | null>(null);

  constructor(
    private carteGriseAuth: CarteGriseAuthService,
    private router: Router
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.processFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file?.type.startsWith('image/')) this.processFile(file);
  }

  processFile(file: File): void {
    this.selectedFile.set(file);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.extractedData.set(null);

    const reader = new FileReader();
    reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  login(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.carteGriseAuth.loginWithCarteGrise(file).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        if (response.success && response.token) {
          this.extractedData.set({
            matricule: response.matricule!,
            chassis:   response.chassis!
          });

          localStorage.setItem('kc_token', response.token);
          this.successMessage.set('Connexion réussie ! Redirection...');
          setTimeout(() => this.router.navigate(['/home']), 1500);

        } else {
          this.errorMessage.set(response.error || 'Erreur inconnue');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.error || 'Carte grise non reconnue dans le système'
        );
      }
    });
  }

  reset(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.extractedData.set(null);
  }
}