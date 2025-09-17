import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  // Skip adding token for login/signup/public routes
  const publicUrls = [
    `${environment.apiUrl}/auth/login`, 
    `${environment.apiUrl}/auth/register`
  ];

  if (publicUrls.includes(req.url)) {
    return next(req);
  }

  // Clone the request and add authorization header
  const token = localStorage.getItem(environment.tokenKey);
  
  const authReq = token 
    ? req.clone({
        setHeaders: { 
          Authorization: `Bearer ${token}` 
        }
      }) 
    : req;

  return next(authReq).pipe(
    catchError(error => {
      // If unauthorized, attempt to refresh token
      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap(newTokenResponse => {
            // Retry the original request with new token
            const retryReq = req.clone({
              setHeaders: { 
                Authorization: `Bearer ${newTokenResponse.accessToken}` 
              }
            });
            return next(retryReq);
          }),
          catchError(refreshError => {
            // If refresh fails, logout and redirect to login
            notificationService.showError('Session expired. Please log in again.');
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }
      
      // For other errors, rethrow
      return throwError(() => error);
    })
  );
};
