import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    // If trying to access login or signup while authenticated, redirect to home
    if (state.url === '/login' || state.url === '/signup') {
      router.navigate(['/home']);
      return false;
    }
    return true;
  }

  // If not authenticated and trying to access protected routes, redirect to login
  if (state.url !== '/login' && state.url !== '/signup') {
    notificationService.showError('Please log in to access this page');
    router.navigate(['/login'], { 
      queryParams: { 
        returnUrl: state.url 
      } 
    });
    return false;
  }

  // Allow access to login and signup pages when not authenticated
  return true;
};