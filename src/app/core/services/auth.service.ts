import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import { LoginDto, TokenResponseDto, RefreshTokenDto, User, RegisterDto } from '../models/auth.models';
import { ApiResponse } from '../models/api-response.models';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem(environment.tokenKey);
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.tokenSubject.next(token);
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(loginDto: LoginDto): Observable<TokenResponseDto> {
    return this.http.post<ApiResponse<TokenResponseDto>>(`${this.apiUrl}/auth/login`, loginDto).pipe(
      map(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
          this.notificationService.showSuccess('Login successful');
          return response.data;
        }
        throw new Error(response.message || 'Login failed');
      }),
      catchError(this.handleError)
    );
  }

  register(registerDto: RegisterDto): Observable<TokenResponseDto> {
    return this.http.post<ApiResponse<TokenResponseDto>>(`${this.apiUrl}/auth/register`, registerDto).pipe(
      map(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
          this.notificationService.showSuccess('Registration successful');
          return response.data;
        }
        throw new Error(response.message || 'Registration failed');
      }),
      catchError(this.handleError)
    );
  }

  logout(): Observable<boolean> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/logout`, {}).pipe(
      map(response => {
        if (response.success) {
          this.clearSession();
          this.notificationService.showSuccess('Logged out successfully');
          this.router.navigate(['/login']);
          return true;
        }
        throw new Error(response.message || 'Logout failed');
      }),
      catchError(this.handleError)
    );
  }

  refreshToken(): Observable<TokenResponseDto> {
    const refreshToken = localStorage.getItem(environment.refreshTokenKey);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const refreshDto: RefreshTokenDto = { refreshToken };
    return this.http.post<ApiResponse<TokenResponseDto>>(`${this.apiUrl}/auth/refresh-token`, refreshDto).pipe(
      map(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
          return response.data;
        }
        throw new Error(response.message || 'Token refresh failed');
      }),
      catchError(this.handleError)
    );
  }

  private setSession(tokenResponse: TokenResponseDto): void {
    // Store tokens
    localStorage.setItem(environment.tokenKey, tokenResponse.accessToken);
    localStorage.setItem(environment.refreshTokenKey, tokenResponse.refreshToken);

    // Update token and user subjects
    this.tokenSubject.next(tokenResponse.accessToken);
    
    // Decode token to get user info
    const user: User = this.decodeToken(tokenResponse.accessToken);
    this.currentUserSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  private clearSession(): void {
    // Clear local storage
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    localStorage.removeItem('user');

    // Reset subjects
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  private decodeToken(token: string): User {
    // This is a simplified token decoding. In a real app, you'd use a proper JWT decoder
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace('-', '+').replace('_', '/');
      const payload = JSON.parse(window.atob(base64));

      // XML Schema claim names
      const nameIdentifierClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
      const nameClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
      const emailClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';

      return {
        // id: payload[nameIdentifierClaim],
        username: payload[nameClaim],
        email: payload[emailClaim]
      };
    } catch (error) {
      console.error('Error decoding token', error);
      throw new Error('Invalid token');
    }
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 401) {
        // Unauthorized - likely an invalid token
        this.clearSession();
        this.router.navigate(['/login']);
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }

    this.notificationService.showError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // Utility methods
  isLoggedIn(): boolean {
    return !!localStorage.getItem(environment.tokenKey);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }
}
