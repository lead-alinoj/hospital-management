import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="placeholder-container">
      <mat-card class="placeholder-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon color="primary" class="large-icon">construction</mat-icon>
            {{ title }}
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="message">
            <h2>Under Development</h2>
            <p>{{ message }}</p>
            <p>This feature is currently being developed and will be available soon.</p>
          </div>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-raised-button color="primary" routerLink="/">
            <mat-icon>home</mat-icon>
            Go to Dashboard
          </button>
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Go Back
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .placeholder-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 70vh;
      padding: 20px;
    }
    
    .placeholder-card {
      max-width: 500px;
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
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }
  `]
})
export class PlaceholderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  title = 'Coming Soon';
  message = 'This page is under development.';

  ngOnInit(): void {
    // Get data from route
    this.route.data.subscribe(data => {
      if (data['title']) {
        this.title = data['title'];
      }
      if (data['message']) {
        this.message = data['message'];
      }
    });
  }

  goBack(): void {
    window.history.back();
  }
}