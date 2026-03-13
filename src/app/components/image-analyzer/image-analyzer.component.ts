import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { GeminiService } from '../../services/gemini.service';

interface CarteGriseData {
  immatriculation: string;
  chassis: string;
}

@Component({
  selector: 'app-image-analyzer',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './image-analyzer.component.html',
  styleUrl: './image-analyzer.component.css'
})
export class ImageAnalyzerComponent {
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isLoading = signal(false);
  carteGrise = signal<CarteGriseData | null>(null);
  errorMessage = signal<string | null>(null);
  isDragOver = signal(false);

  constructor(private geminiService: GeminiService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
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
    if (file && file.type.startsWith('image/')) {
      this.processFile(file);
    }
  }

  processFile(file: File): void {
    this.selectedFile.set(file);
    this.carteGrise.set(null);
    this.errorMessage.set(null);
  }

  analyzeImage(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isLoading.set(true);
    this.carteGrise.set(null);
    this.errorMessage.set(null);

    // Créer preview
    const reader = new FileReader();
    reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);

    this.geminiService.analyzeImage(file).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.carteGrise.set(this.parseCarteGrise(response.result));
        } else {
          this.errorMessage.set(response.error || 'Erreur inconnue');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Erreur de connexion au serveur.');
        console.error(err);
      }
    });
  }

  private parseCarteGrise(text: string): CarteGriseData {
    const lines = text.split('\n');
    let immatriculation = 'Non lisible';
    let chassis = 'Non lisible';

    for (const line of lines) {
      if (line.includes("immatriculation") || line.includes("Immatriculation")) {
        const parts = line.split(':');
        if (parts.length > 1) immatriculation = parts.slice(1).join(':').trim();
      }
      if (line.includes("châssis") || line.includes("VIN") || line.includes("chassis")) {
        const parts = line.split(':');
        if (parts.length > 1) chassis = parts.slice(1).join(':').trim();
      }
    }

    return { immatriculation, chassis };
  }

  reset(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.carteGrise.set(null);
    this.errorMessage.set(null);
  }
}