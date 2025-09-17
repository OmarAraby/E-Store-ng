import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { RegisterDto } from '../../core/models/auth.models';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private title = inject(Title);

  // Signals for reactive state management
  isLoading = signal(false);
  errors = signal<string[]>([]);

  // Reactive form with comprehensive validation
  signupForm = this.fb.group({
    username: ['', [
      Validators.required, 
      Validators.minLength(3), 
      Validators.maxLength(50),
      Validators.pattern(/^[a-zA-Z0-9_]+$/)
    ]],
    email: ['', [
      Validators.required, 
      Validators.email,
      Validators.maxLength(100)
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(50),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
    ]],
    confirmPassword: ['', [
      Validators.required,
      this.passwordMatchValidator
    ]]
  });

  constructor() {
    this.title.setTitle('Create Account');

    // Add real-time password matching validation
    this.signupForm.get('password')?.valueChanges.subscribe(() => {
      const confirmPasswordControl = this.signupForm.get('confirmPassword');
      if (confirmPasswordControl?.value) {
        confirmPasswordControl.updateValueAndValidity();
      }
    });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const form = control.parent;
    if (!form) return null;

    const password = form.get('password');
    const confirmPassword = control;

    if (password && confirmPassword) {
      const passwordValue = password.value;
      const confirmPasswordValue = confirmPassword.value;

      return passwordValue === confirmPasswordValue 
        ? null 
        : { passwordMismatch: true };
    }

    return null;
  }

  // Detailed error messages for form fields
  getFieldError(field: string): string | null {
    const control = this.signupForm.get(field);
    if (!control || !control.errors) return null;

    if (control.errors['required']) {
      return `${this.formatFieldName(field)} is required`;
    }

    if (field === 'username') {
      if (control.errors['minlength']) {
        return 'Username must be at least 3 characters long';
      }
      if (control.errors['maxlength']) {
        return 'Username cannot exceed 50 characters';
      }
      if (control.errors['pattern']) {
        return 'Username can only contain letters, numbers, and underscores';
      }
    }

    if (field === 'email') {
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['maxlength']) {
        return 'Email cannot exceed 100 characters';
      }
    }

    if (field === 'password') {
      if (control.errors['minlength']) {
        return 'Password must be at least 6 characters long';
      }
      if (control.errors['maxlength']) {
        return 'Password cannot exceed 50 characters';
      }
      if (control.errors['pattern']) {
        return 'Password must include uppercase, lowercase, number, and special character';
      }
    }

    if (field === 'confirmPassword') {
      if (control.errors['required']) {
        return 'Please confirm your password';
      }
      if (control.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }

    return null;
  }

  // Helper to format field names
  private formatFieldName(field: string): string {
    return field.charAt(0).toUpperCase() + field.slice(1);
  }

  // Check if a field has an error and was touched
  hasError(field: string): boolean {
    const control = this.signupForm.get(field);
    return !!(control?.invalid && (control?.dirty || control?.touched));
  }

  // Signup submission method
  onSubmit() {
    // Mark all fields as touched to show validation
    this.signupForm.markAllAsTouched();

    // Reset previous errors
    this.errors.set([]);

    // Check form validity
    if (this.signupForm.invalid) {
      // Collect all validation errors
      const formErrors: string[] = [];
      Object.keys(this.signupForm.controls).forEach(field => {
        const control = this.signupForm.get(field);
        if (control?.errors) {
          const error = this.getFieldError(field);
          if (error) formErrors.push(error);
        }
      });
      
      this.errors.set(formErrors);
      return;
    }

    // Prepare registration data
    const registerData: RegisterDto = {
      username: this.signupForm.value.username || '',
      email: this.signupForm.value.email || '',
      password: this.signupForm.value.password || ''
    };

    // Set loading state
    this.isLoading.set(true);

    // Perform registration
    this.authService.register(registerData).subscribe({
      next: () => {
        this.notificationService.showSuccess('Account created successfully');
        this.router.navigate(['/']);
      },
      error: (err) => {
        // Handle registration errors
        this.isLoading.set(false);
        const errorMessage = err.message || 'Registration failed';
        this.errors.set([errorMessage]);
        this.notificationService.showError(errorMessage);
      }
    });
  }

  // Navigate to login page
  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
