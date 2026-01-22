import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="unauthorized-container">
      <mat-card class="unauthorized-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon color="warn" class="large-icon">warning</mat-icon>
            Access Pending Approval
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="message">
            <h2>Your account is under review</h2>
            <p>
              Thank you for registering! Your account has been created successfully 
              but requires administrator approval before you can access the system.
            </p>
            <p>
              An administrator will review your registration and assign you a role 
              (Doctor, Nurse, Reception, or Pharmacy). Once approved, you'll be able 
              to log in and access the system.
            </p>
            <p class="note">
              <mat-icon>info</mat-icon>
              You'll receive an email notification once your account is activated.
            </p>
          </div>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="goToLogin()">
            <mat-icon>login</mat-icon>
            Return to Login
          </button>
          <button mat-button (click)="contactSupport()">
            <mat-icon>support</mat-icon>
            Contact Support
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 20px;
    }
    
    .unauthorized-card {
      max-width: 600px;
      text-align: center;
    }
    
    .large-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-right: 16px;
      vertical-align: middle;
    }
    
    .message {
      margin: 20px 0;
    }
    
    .note {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
    }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  contactSupport(): void {
    // Implement contact support logic
    window.location.href = 'mailto:admin@hospital.com';
  }
}