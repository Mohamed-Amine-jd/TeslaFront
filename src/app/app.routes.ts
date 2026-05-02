import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { OtpVerificationComponent } from './components/otp-verification/otp-verification.component';
import { ChargingMapComponent } from './components/charging-map/charging-map.component';
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'foreign-vehicle', loadComponent: () => import('./components/foreign-vehicle/foreign-vehicle.component').then(m => m.ForeignVehicleComponent) },
  { path: 'verify-otp', component: OtpVerificationComponent }, // Nouveau !
  { path: 'charging-map', component: ChargingMapComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];