// src/app/app.component.ts
import { Component } from '@angular/core';
import { ImageAnalyzerComponent } from './components/image-analyzer/image-analyzer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ImageAnalyzerComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {}