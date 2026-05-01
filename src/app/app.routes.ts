import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { OtpVerificationComponent } from './components/otp-verification/otp-verification.component';
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'verify-otp', component: OtpVerificationComponent }, // Nouveau !
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];