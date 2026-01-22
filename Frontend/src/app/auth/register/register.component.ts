import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';
import { UserRole } from '../../models/user.model';
import { RouterModule } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { Optional } from '@angular/core';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  loading = false;
  roles: UserRole[] = ['Admin', 'Doctor', 'Reception', 'Nurse', 'Pharmacy'];

  constructor( @Optional() private dialogRef?: MatDialogRef<RegisterComponent>
) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { role: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // If already logged in, redirect to dashboard
    if (this.authService.isAuthenticated()) {
      this.redirectToDashboard();
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    
    const { confirmPassword, ...userData } = this.registerForm.value;
    
    this.authService.register(userData).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Registration successful! Please login.', 'Close', {
            duration: 3000,
            verticalPosition: 'top'
          });
 this.dialogRef?.close({ registered: true });

  // ✅ Navigate to landing page
  this.router.navigate(['/']);        } else {
          this.snackBar.open(response.error || 'Registration failed', 'Close', {
            duration: 3000,
            verticalPosition: 'top'
          });
        }
        this.loading = false;
      },
      error: (error) => {
        const errorMessage = error.error?.error || 'An error occurred during registration';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 3000,
          verticalPosition: 'top'
        });
        this.loading = false;
      }
    });
  }
closeDialog(): void {
  this.dialogRef?.close();
}

  private redirectToDashboard(): void {
    const dashboardRoute = this.authService.getDashboardRoute();
    this.router.navigate([dashboardRoute]);
  }
  

  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get role() { return this.registerForm.get('role'); }
}