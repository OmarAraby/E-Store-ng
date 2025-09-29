import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { LoginDto } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';
import { finalize } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { Title } from '@angular/platform-browser';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private title = inject(Title);

  isLoading = signal(false);  
  loginForm = new FormGroup({
    email: new FormControl('', [
      Validators.required, 
      Validators.email,
      Validators.maxLength(100)
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(50)
    ])
  });

  // Store return URL from route parameters or default to home
  private returnUrl: string = '/home';

  constructor() {
    this.title.setTitle('Login');
  }

  ngOnInit() {
    // Get return URL from route parameters or default to home
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/home';
    });
  }

  getFieldError(field: string): string | null {
    const control = this.loginForm.get(field);
    if (!control || !control.errors) return null;

    if (control.errors['required']) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }

    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }

    if (control.errors['minLength']) {
      return `${field} must be at least 6 characters long`;
    }

    if (control.errors['maxLength']) {
      return `${field} cannot exceed 50 characters`;
    }

    return null;
  }

  login() {
    // Mark all fields as touched to trigger validation
    this.loginForm.markAllAsTouched();

    // Check form validity before submission
    if (this.loginForm.invalid) {
      this.notificationService.showError('Please correct the errors in the form');
      return;
    }

    // Prepare login data
    const loginData: LoginDto = {
      email: this.loginForm.value.email || '',
      password: this.loginForm.value.password || ''
    };

    // Set loading state
    this.isLoading.set(true);

    // Perform login
    this.authService.login(loginData).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: () => {
        const currentUser = this.authService.getCurrentUser();
        const username = currentUser ? currentUser.username : 'there';

        this.title.setTitle('Home');
        // Navigate to return URL or home
        this.router.navigateByUrl(this.returnUrl);
        this.notificationService.showSuccess('Welcome back '+username);
      },
      error: (err) => {
        // More specific error handling
        const errorMessage = err.message || 'Login failed. Please try again.';
        this.notificationService.showError(errorMessage);
        this.loginForm.get('password')?.reset(); // Clear password field on error
      }
    });
  }

  // Optional: Add method to navigate to signup
  navigateToSignup() {
    this.router.navigate(['/signup']);
  }
}
