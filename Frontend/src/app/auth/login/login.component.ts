import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';
import { RouterModule } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { Optional } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule

  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
private dialogRef = inject(MatDialogRef<LoginComponent>, { optional: true });

hideLogin = false; 
  loginForm: FormGroup;
  hidePassword = true;
  loading = false;
  returnUrl = '';
isBlocked = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
    
    // If already logged in, redirect to dashboard
    if (this.authService.isAuthenticated()) {
          this.isBlocked = true;        // ⛔ block UI immediately

      this.redirectToDashboard();
    }
  }
closeLogin() {
  this.dialogRef?.close();
}

// Update the onSubmit method to handle different error scenarios:
onSubmit(): void {
  if (this.loginForm.invalid) {
    return;
  }

  this.loading = true;
  
  this.authService.login(this.loginForm.value).subscribe({
    next: (response: any) => {
      console.log('Login response:', response);
      
      if (response.success) {
        this.snackBar.open('Login successful!', 'Close', {
          duration: 3000,
          verticalPosition: 'top'
        });
          this.dialogRef?.close({ loggedIn: true });

        // Redirect based on user status
        if (!response.user.isActive || !response.user.role) {
          // User not activated or no role assigned
          this.router.navigate(['/unauthorized']);
        } else {
          // User is active and has a role - redirect to dashboard
          const dashboardRoute = this.authService.getDashboardRoute();
          this.router.navigate([dashboardRoute]);
        }
      } else {
        this.snackBar.open(response.error || 'Login failed', 'Close', {
          duration: 3000,
          verticalPosition: 'top'
        });
      }
      this.loading = false;
    },
    error: (error) => {
      console.error('Login error:', error);
      let errorMessage = 'An error occurred during login';
      
      if (error.status === 401) {
        errorMessage = error.error?.error || 'Invalid credentials';
        
        // Handle specific error messages
        if (error.error?.error?.includes('pending admin approval') || 
            error.error?.error?.includes('pending role assignment')) {
          this.router.navigate(['/unauthorized']);
        }
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      this.snackBar.open(errorMessage, 'Close', {
        duration: 3000,
        verticalPosition: 'top'
      });
      this.loading = false;
    }
  });
}

  private redirectToDashboard(): void {
    const dashboardRoute = this.authService.getDashboardRoute();
    this.router.navigate([dashboardRoute]);
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}