import { Component, OnInit, AfterViewInit } from '@angular/core';

declare var particlesJS: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  
  email: string = '';
  isSubmitted: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initParticles();
  }

  /**
   * Initialise les particules en arrière-plan
   */
  private initParticles(): void {
    particlesJS('particles-js', {
      "particles": {
        "number": {
          "value": 60,
          "density": {
            "enable": true,
            "value_area": 1000
          }
        },
        "color": {
          "value": "#ffffff"
        },
        "shape": {
          "type": "circle",
          "stroke": {
            "width": 0,
            "color": "#000000"
          }
        },
        "opacity": {
          "value": 0.5,
          "random": false
        },
        "size": {
          "value": 5,
          "random": true
        },
        "line_linked": {
          "enable": true,
          "distance": 200,
          "color": "#ffffff",
          "opacity": 0.4,
          "width": 1
        },
        "move": {
          "enable": true,
          "speed": 6,
          "direction": "none",
          "random": false,
          "straight": false,
          "out_mode": "out"
        }
      },
      "interactivity": {
        "detect_on": "canvas",
        "events": {
          "onhover": {
            "enable": true,
            "mode": "repulse"
          },
          "onclick": {
            "enable": true,
            "mode": "push"
          },
          "resize": true
        }
      },
      "retina_detect": true
    });
  }

  onSubmit(): void {
    if (this.email.trim()) {
      console.log('Email soumis:', this.email);
      this.isSubmitted = true;
      setTimeout(() => {
        this.email = '';
        this.isSubmitted = false;
      }, 3000);
    }
  }

  openSocialLink(platform: string): void {
    const links: { [key: string]: string } = {
      'facebook': 'https://www.facebook.com',
      'google': 'https://www.google.com',
      'twitter': 'https://www.twitter.com',
      'linkedin': 'https://www.linkedin.com'
    };
    
    if (links[platform]) {
      window.open(links[platform], '_blank');
    }
  }
}