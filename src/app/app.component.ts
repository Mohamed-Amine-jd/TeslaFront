// src/app/app.component.ts
import { Component } from '@angular/core';
import { ImageAnalyzerComponent } from './components/image-analyzer/image-analyzer.component';
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {}