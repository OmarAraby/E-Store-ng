import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const initialRouteResolver: ResolveFn<boolean> = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    // Redirect to home if authenticated
    router.navigate(['/home']);
    return false;
  }

  // Allow navigation to login page
  return true;
};
