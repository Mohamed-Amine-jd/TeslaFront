import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarteGriseAuthService } from '../../services/carte-grise-auth.service';

type PlateType = 'TUN' | 'RS' | 'GOV' | 'INT';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  // UI State
  selectedType = signal<PlateType>('TUN');
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isDragOver = signal(false);
  extractedData = signal<{ matricule: string, chassis: string } | null>(null);

  // Form Fields
  plateLeft = '';
  plateRight = '';
  manualMatricule = ''; // Used for non-TUN types
  manualChassis = '';

  constructor(
    private carteGriseAuth: CarteGriseAuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  selectType(type: PlateType) {
    this.selectedType.set(type);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    // Hide preview and reset file if switching away from TUN
    if (type !== 'TUN') {
      this.selectedFile.set(null);
      this.previewUrl.set(null);
    }
  }

  // --- OCR / File Handling Logic ---

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.processFile(input.files[0]);
      this.scanImage();
    }
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

  scanImage(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formData = new FormData();
    formData.append('image', file);

    this.carteGriseAuth.analyzeImageWithGemini(formData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);

        if (response.success && response.result) {
          const parsed = this.parseGeminiResult(response.result);

          if (parsed.matricule && parsed.chassis) {
            this.extractedData.set(parsed);
            this.manualChassis = parsed.chassis;

            // Auto-fill visual plate fields
            const norm = this.normaliserMatricule(parsed.matricule);
            const match = norm.match(/^(\d+)([a-z]+)(\d+)$/);
            
            if (match) {
              this.plateLeft = match[1];
              this.plateRight = match[3];
            } else {
              this.manualMatricule = parsed.matricule;
            }

            this.cdr.markForCheck();
            this.successMessage.set('✓ Carte grise scanned successfully!');
          } else {
            this.errorMessage.set('Could not extract matricule and chassis from the image');
          }
        } else {
          this.errorMessage.set(response.error || 'Scan failed');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Scan request failed');
      }
    });
  }

  // --- Submission Logic ---

  loginManual(): void {
    let matriculeRaw = '';

    if (this.selectedType() === 'TUN') {
      if (this.plateLeft.trim() && this.plateRight.trim()) {
        matriculeRaw = `${this.plateLeft.trim()}tu${this.plateRight.trim()}`;
      } else {
        const data = this.extractedData();
        if (!data?.matricule) {
          this.errorMessage.set('Please fill the license plate or scan your carte grise');
          return;
        }
        matriculeRaw = data.matricule;
      }
    } else {
      if (!this.manualMatricule.trim()) {
        this.errorMessage.set(`Please enter the ${this.selectedType()} number`);
        return;
      }
      matriculeRaw = this.manualMatricule;
    }

    const matriculeNormalise = this.normaliserMatricule(matriculeRaw);
    this.errorMessage.set(null);

    this.carteGriseAuth.getUserInfo(matriculeNormalise).subscribe({
      next: (response) => {
        if (!response?.success) {
          this.errorMessage.set(response?.error || 'Profile not found');
          return;
        }
        this.router.navigate(['/verify-otp'], {
          state: {
            matricule: response.matricule ?? matriculeNormalise,
            chassis: this.manualChassis.trim(),
            email: response.email,
            phone: response.phone
          }
        });
         localStorage.setItem('email', response.email),
          localStorage.setItem('phone', response.phone);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error || 'Could not fetch contact information');
      }
    });
  }

  // --- Normalization & Parsing Helpers ---

  private normaliserMatricule(matricule: string): string {
    if (!matricule) return '';

    let result = matricule
      .toLowerCase()
      .trim()
      .replace(/تونس/g, 'tu')
      .replace(/tunisie/g, 'tu')
      .replace(/tunis/g, 'tu')
      .replace(/tun/g, 'tu')
     
      .replace(/[\s\-_]+/g, '');

    return this.reordonnerMatricule(result);
  }
goToForeignVehicle(): void {
  this.router.navigate(['/foreign-vehicle']);
}
  private reordonnerMatricule(matricule: string): string {
    const match = matricule.match(/^(\d+)([a-z]+)(\d+)$/);
    if (match) {
      const n1 = parseInt(match[1]);
      const n2 = parseInt(match[3]);
      if (n1 > n2) {
        return match[3] + match[2] + match[1];
      }
    }
    return matricule;
  }

  private parseGeminiResult(resultText: string): { matricule: string; chassis: string } {
    let matricule = '';
    let chassis = '';

    for (const line of resultText.split(/\r?\n/)) {
      const lower = line.toLowerCase();
      if (lower.includes('immatriculation')) {
        matricule = this.valueAfterColon(line);
      }
      if (lower.includes('châssis') || lower.includes('chassis')) {
        chassis = this.valueAfterColon(line);
      }
    }

    // Fallback regex if colon parsing fails
    if (!matricule) {
      const m = resultText.match(/immatriculation\s*[:：]\s*([^\n]+)/i);
      if (m) matricule = m[1].trim();
    }
    if (!chassis) {
      const m = resultText.match(/châssis\s*[:：]\s*([^\n]+)/i) || resultText.match(/chassis\s*[:：]\s*([^\n]+)/i);
      if (m) chassis = m[1].trim();
    }

    return { matricule, chassis };
  }

  private valueAfterColon(line: string): string {
    const idx = line.indexOf(':');
    if (idx === -1) {
      const idxCn = line.indexOf('：');
      if (idxCn === -1) return '';
      return line.slice(idxCn + 1).trim();
    }
    return line.slice(idx + 1).trim();
  }

  reset(): void {
    this.selectedType.set('TUN');
    this.plateLeft = '';
    this.plateRight = '';
    this.manualMatricule = '';
    this.manualChassis = '';
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.extractedData.set(null);
  }
}

/*
import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarteGriseAuthService } from '../../services/carte-grise-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  maskedEmail    = signal<string | null>(null);
  maskedPhone    = signal<string | null>(null);
  rawGemini      = signal<string | null>(null);

  // ✅ Champs plaque tunisienne
  plateLeft  = '';
  plateRight = '';
  manualChassis = '';

  // Garde pour compatibilité
  manualMatricule = '';

  constructor(
    private carteGriseAuth: CarteGriseAuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.processFile(input.files[0]);
      this.scanImage();
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
    if (file?.type.startsWith('image/')) {
      this.processFile(file);
      this.scanImage();
    }
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

  scanImage(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    console.log('📸 Starting scan for file:', file.name, file.size, 'bytes');

    const formData = new FormData();
    formData.append('image', file);

    this.carteGriseAuth.analyzeImageWithGemini(formData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        console.log('✅ Gemini response received:', response);

        if (response.success && response.result) {
          const parsed = this.parseGeminiResult(response.result);
          console.log('📝 Parsed result:', parsed);

          if (parsed.matricule && parsed.chassis) {
            this.extractedData.set(parsed);
            this.manualChassis = parsed.chassis;

            // ✅ Remplir automatiquement plateLeft et plateRight
            const norm  = this.normaliserMatricule(parsed.matricule);
            const match = norm.match(/^(\d+)([a-z]+)(\d+)$/);
            if (match) {
              this.plateLeft  = match[1]; // ex: 190
              this.plateRight = match[3]; // ex: 765
              console.log('Plaque → Gauche:', this.plateLeft, '| Droite:', this.plateRight);
            } else {
              this.manualMatricule = parsed.matricule;
            }

            this.cdr.markForCheck();
            this.successMessage.set('✓ Carte grise scanned successfully!');
          } else {
            this.errorMessage.set('Could not extract matricule and chassis from the image');
          }
        } else {
          this.errorMessage.set(response.error || 'Scan failed');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Scan request failed');
      }
    });
  }

  loginManual(): void {
    const chassis = this.manualChassis.trim();

    // ✅ Construire le matricule depuis plateLeft + tu + plateRight
    let matriculeRaw = '';

    if (this.plateLeft.trim() && this.plateRight.trim()) {
      matriculeRaw = `${this.plateLeft.trim()}tu${this.plateRight.trim()}`;
      console.log('Matricule depuis plaque visuelle :', matriculeRaw);
    } else {
      const data = this.extractedData();
      if (!data?.matricule) {
        this.errorMessage.set('Please fill the license plate or scan your carte grise');
        return;
      }
      matriculeRaw = data.matricule;
    }

    const matriculeNormalise = this.normaliserMatricule(matriculeRaw);
    console.log('Matricule normalisé :', matriculeNormalise);

    this.errorMessage.set(null);

    this.carteGriseAuth.getUserInfo(matriculeNormalise).subscribe({
      next: (response) => {
        if (!response?.success) {
          this.errorMessage.set(response?.error || 'Profil non trouvé');
          return;
        }
        this.router.navigate(['/verify-otp'], {
          state: {
            matricule: response.matricule ?? matriculeNormalise,
            chassis:   chassis,
            email:     response.email,
            phone:     response.phone
          }
        });
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.error || err.message || 'Could not fetch contact information'
        );
      }
    });
  }

  private normaliserMatricule(matricule: string): string {
    if (!matricule) return '';

    let result = matricule
      .toLowerCase()
      .trim()
      .replace(/تونس/g,      'tu')
      .replace(/tunisie/g,   'tu')
      .replace(/tunis/g,     'tu')
      .replace(/tun/g,       'tu')
      .replace(/sfax/g,      'sf')
      .replace(/sousse/g,    'so')
      .replace(/nabeul/g,    'na')
      .replace(/monastir/g,  'mo')
      .replace(/ariana/g,    'ar')
      .replace(/bizerte/g,   'bi')
      .replace(/gabes/g,     'ga')
      .replace(/gafsa/g,     'gf')
      .replace(/jendouba/g,  'je')
      .replace(/kairouan/g,  'ka')
      .replace(/kasserine/g, 'ks')
      .replace(/kebili/g,    'kb')
      .replace(/kef/g,       'kf')
      .replace(/mahdia/g,    'mh')
      .replace(/manouba/g,   'mn')
      .replace(/medenine/g,  'me')
      .replace(/siliana/g,   'si')
      .replace(/tataouine/g, 'ta')
      .replace(/tozeur/g,    'to')
      .replace(/zaghouan/g,  'za')
      .replace(/beja/g,      'be')
      .replace(/sidi bouzid/g,'sb')
      .replace(/[\s\-_]+/g,  '');

    return this.reordonnerMatricule(result);
  }

  private reordonnerMatricule(matricule: string): string {
    const match = matricule.match(/^(\d+)([a-z]+)(\d+)$/);
    if (match) {
      const n1 = parseInt(match[1]);
      const n2 = parseInt(match[3]);
      if (n1 > n2) {
        const corrected = match[3] + match[2] + match[1];
        console.log(`Matricule réordonné : ${matricule} → ${corrected}`);
        return corrected;
      }
    }
    return matricule;
  }

  private parseGeminiResult(resultText: string): { matricule: string; chassis: string } {
    let matricule = '';
    let chassis   = '';

    for (const line of resultText.split(/\r?\n/)) {
      const lower = line.toLowerCase();
      if (lower.includes('immatriculation')) {
        matricule = this.valueAfterColon(line);
      }
      if (lower.includes('châssis') || lower.includes('chassis')) {
        chassis = this.valueAfterColon(line);
      }
    }

    if (!matricule) {
      const m = resultText.match(/immatriculation\s*[:：]\s*([^\n]+)/i);
      if (m) matricule = m[1].trim();
    }
    if (!chassis) {
      const m = resultText.match(/châssis\s*[:：]\s*([^\n]+)/i)
             || resultText.match(/chassis\s*[:：]\s*([^\n]+)/i);
      if (m) chassis = m[1].trim();
    }

    return { matricule, chassis };
  }

  private valueAfterColon(line: string): string {
    const idx = line.indexOf(':');
    if (idx === -1) {
      const idxCn = line.indexOf('：');
      if (idxCn === -1) return '';
      return line.slice(idxCn + 1).trim();
    }
    return line.slice(idx + 1).trim();
  }

  openForeign(): void {
    const left    = this.plateLeft.trim();
    const right   = this.plateRight.trim();
    const matricule = left && right ? `${left}tu${right}` : this.manualMatricule;
    this.router.navigate(['/foreign-vehicle'], {
      state: { matricule, chassis: this.manualChassis }
    });
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
            chassis:   response.chassis ?? ''
          });

          if (response.matricule) {
            const norm  = this.normaliserMatricule(response.matricule);
            const match = norm.match(/^(\d+)([a-z]+)(\d+)$/);
            if (match) {
              this.plateLeft  = match[1];
              this.plateRight = match[3];
            }
          }
          if (response.chassis) this.manualChassis = response.chassis;

          localStorage.setItem('kc_token', response.token);
          this.successMessage.set('Connexion réussie ! Redirection...');
          this.router.navigate(['/verify-otp'], {
            state: {
              matricule: response.matricule,
              chassis:   response.chassis,
              email:     response.email,
              phone:     response.phone
            }
          });
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
    this.plateLeft  = '';
    this.plateRight = '';
    this.manualChassis = '';
  }
}*/