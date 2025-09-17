import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoginDto, TokenResponseDto, RefreshTokenDto, User } from '../models/auth.models';
import { ApiResponse } from '../models/api-response.models';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private notificationService = inject(NotificationService);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem('access_token');
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

  register(registerDto: any): Observable<TokenResponseDto> {
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
    const refreshToken = localStorage.getItem('refresh_token');
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
    localStorage.setItem('access_token', tokenResponse.accessToken);
    localStorage.setItem('refresh_token', tokenResponse.refreshToken);

    // Update token and user subjects
    this.tokenSubject.next(tokenResponse.accessToken);
    
    // Decode token to get user info (you might want to create a helper method for this)
    const user: User = this.decodeToken(tokenResponse.accessToken);
    this.currentUserSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  private clearSession(): void {
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    // Reset subjects
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  private decodeToken(token: string): User {
    // simple JWT decoder
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace('-', '+').replace('_', '/');
      const payload = JSON.parse(window.atob(base64));

      return {
        id: payload.nameid,
        username: payload.name,
        email: payload.email
      };
    } catch (error) {
      console.error('Error decoding token', error);
      throw new Error('Invalid token');
    }
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // server-side error
      if (error.status === 401) {
        // unauthorized - likely an invalid token
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
    return !!localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }
}
