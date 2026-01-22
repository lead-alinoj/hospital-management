// components/nurse/dashboard.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { VisitService } from '../../service/visit.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-nurse-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatBadgeModule,
    MatTabsModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="nurse-dashboard-container">
      <!-- Dashboard Header -->
      <div class="dashboard-header">
        <mat-card class="welcome-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon class="welcome-icon">medical_services</mat-icon>
              Nurse Dashboard
            </mat-card-title>
            <mat-card-subtitle>Welcome, {{ currentShift }} shift</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="stats-summary">
              <div class="stat-item">
                <div class="stat-number" [ngClass]="{'highlight': pendingVitalsCount > 0}">
                  {{ pendingVitalsCount }}
                </div>
                <div class="stat-label">Patients Waiting</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ vitalsCompletedCount }}</div>
                <div class="stat-label">Vitals Done</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ totalVisits }}</div>
                <div class="stat-label">Total Today</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ emergencyCount }}</div>
                <div class="stat-label">Emergencies</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Quick Actions</mat-card-title>
            <button mat-button color="primary" (click)="refreshVisits()" [disabled]="isLoading">
              <mat-icon>refresh</mat-icon>
              {{ isLoading ? 'Loading...' : 'Refresh' }}
            </button>
          </mat-card-header>
          <mat-card-content>
            <div class="action-buttons">
              <button mat-raised-button color="primary" routerLink="/nurse/settings">
                <mat-icon>settings</mat-icon>
                Settings
              </button>
              <!-- <button mat-raised-button color="accent" (click)="printReport()">
                <mat-icon>print</mat-icon>
                Print Report
              </button> -->
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Today's Visits -->
      <div class="today-visits">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Today's Visits for Vitals</mat-card-title>
            <div class="header-badges">
              <span class="shift-badge" [ngClass]="currentShift === 'Morning' ? 'morning-shift' : 'evening-shift'">
                {{ currentShift }} Shift
              </span>
              <span class="last-updated">
                Last Updated: {{ lastUpdated | date:'shortTime' }}
              </span>
            </div>
          </mat-card-header>

          <mat-card-content>
            <!-- Loading State -->
            <div *ngIf="isLoading" class="loading-state">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading today's visits...</p>
            </div>

            <!-- Error State -->
            <div *ngIf="!isLoading && hasError" class="error-state">
              <mat-icon class="error-icon">error_outline</mat-icon>
              <h3>Error Loading Visits</h3>
              <p>{{ errorMessage }}</p>
              <button mat-raised-button color="primary" (click)="loadTodayVisits()">
                <mat-icon>refresh</mat-icon>
                Try Again
              </button>
            </div>

            <!-- Waiting for Vitals Section -->
            <div class="section" *ngIf="!isLoading && !hasError && visitsByStatus.waiting?.length > 0">
              <div class="section-header">
                <h3>
                  <mat-icon class="section-icon">access_time</mat-icon>
                  Waiting for Vitals ({{ visitsByStatus.waiting.length }})
                </h3>
                <span class="priority-badge high-priority">Attend First</span>
              </div>
              
              <div class="visits-list">
                <div *ngFor="let visit of visitsByStatus.waiting" class="visit-card" 
                     [ngClass]="{'emergency': visit.priority === 'Emergency', 'high': visit.priority === 'High'}">
                  <div class="visit-header">
                    <div class="token-info">
                      <span class="token-badge">#{{ visit.tokenNumber || visit.token }}</span>
                      <span class="visit-time">{{ visit.createdAt | date:'shortTime' }}</span>
                    </div>
                    <div class="priority-indicator">
                      <mat-chip *ngIf="visit.priority !== 'Normal'" 
                              [color]="visit.priority === 'Emergency' ? 'warn' : 'accent'" selected>
                        {{ visit.priority }}
                      </mat-chip>
                      <span *ngIf="visit.priority === 'Normal'" class="normal-priority">Normal</span>
                    </div>
                  </div>
                  
                  <div class="patient-info">
                    <div class="patient-details">
                      <div class="patient-name">{{ getPatientName(visit) }}</div>
                      <div class="patient-demographics">
                        {{ getPatientAge(visit) }}Y • {{ getPatientGender(visit) }} • {{ visit.shift || currentShift }} Shift
                      </div>
                    </div>
                    <div class="doctor-info" *ngIf="getDoctorName(visit)">
                      <mat-icon>medical_services</mat-icon>
                      <span>{{ getDoctorName(visit) }}</span>
                    </div>
                  </div>
                  
                  <div class="visit-details">
                    <div class="complaint" *ngIf="visit.chiefComplaint">
                      <mat-icon>sick</mat-icon>
                      <span>{{ visit.chiefComplaint }}</span>
                    </div>
                    <div class="patient-type" *ngIf="getPatientType(visit)">
                      <mat-icon>person</mat-icon>
                      <span>{{ getPatientType(visit) }}</span>
                    </div>
                  </div>
                  
                  <div class="visit-actions">
                    <button mat-raised-button color="primary" (click)="startVitals(visit._id)" [disabled]="isProcessing">
                      <mat-icon>play_arrow</mat-icon>
                      Start Vitals
                    </button>
                    <!-- <button mat-button color="accent" (click)="viewPatientDetails(visit)" [disabled]="isProcessing">
                      <mat-icon>visibility</mat-icon>
                      View Details
                    </button> -->
                  </div>
                </div>
              </div>
            </div>

            <!-- In Progress Section -->
            <div class="section" *ngIf="!isLoading && !hasError && visitsByStatus.vitals_in_progress?.length > 0">
              <div class="section-header">
                <h3>
                  <mat-icon class="section-icon">hourglass_empty</mat-icon>
                  Vitals in Progress ({{ visitsByStatus.vitals_in_progress.length }})
                </h3>
                <span class="status-badge in-progress-badge">In Progress</span>
              </div>
              
              <div class="visits-list">
                <div *ngFor="let visit of visitsByStatus.vitals_in_progress" class="visit-card in-progress">
                  <div class="visit-header">
                    <div class="token-info">
                      <span class="token-badge">#{{ visit.tokenNumber || visit.token }}</span>
                      <span class="visit-time">{{ visit.createdAt | date:'shortTime' }}</span>
                    </div>
                    <div class="time-elapsed">
                      <mat-icon>schedule</mat-icon>
                      <span>Started: {{ calculateTimeElapsed(visit.updatedAt || visit.createdAt) }}</span>
                    </div>
                  </div>
                  
                  <div class="patient-info">
                    <div class="patient-details">
                      <div class="patient-name">{{ getPatientName(visit) }}</div>
                      <div class="patient-demographics">
                        {{ getPatientAge(visit) }}Y • {{ getPatientGender(visit) }}
                      </div>
                    </div>
                    <div class="doctor-info" *ngIf="getDoctorName(visit)">
                      <mat-icon>medical_services</mat-icon>
                      <span>{{ getDoctorName(visit) }}</span>
                    </div>
                  </div>
                  
                  <div class="visit-actions">
                    <button mat-raised-button color="warn" (click)="continueVitals(visit._id)" [disabled]="isProcessing">
                      <mat-icon>edit</mat-icon>
                      Continue Vitals
                    </button>
                    <button mat-button color="primary" (click)="markAsCompleted(visit._id)" [disabled]="isProcessing">
                      <mat-icon>check_circle</mat-icon>
                      Mark Done
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Completed Vitals Section -->
            <div class="section" *ngIf="!isLoading && !hasError && visitsByStatus.vitals_completed?.length > 0">
              <div class="section-header">
                <h3>
                  <mat-icon class="section-icon">check_circle</mat-icon>
                  Vitals Completed ({{ visitsByStatus.vitals_completed.length }})
                </h3>
                <button mat-button (click)="toggleCompletedVisits()">
                  <mat-icon>{{ showCompletedVisits ? 'expand_less' : 'expand_more' }}</mat-icon>
                  {{ showCompletedVisits ? 'Hide' : 'Show' }}
                </button>
              </div>
              
              <div class="visits-list" *ngIf="showCompletedVisits">
                <div *ngFor="let visit of visitsByStatus.vitals_completed" class="visit-card completed">
                  <div class="visit-header">
                    <div class="token-info">
                      <span class="token-badge">#{{ visit.tokenNumber || visit.token }}</span>
                      <span class="status-badge completed-badge">Completed</span>
                    </div>
                    <div class="completion-time">
                      <mat-icon>schedule</mat-icon>
                      <span>Completed: {{ visit.updatedAt | date:'shortTime' }}</span>
                    </div>
                  </div>
                  
                  <div class="patient-info">
                    <div class="patient-details">
                      <div class="patient-name">{{ getPatientName(visit) }}</div>
                      <div class="patient-demographics">
                        {{ getPatientAge(visit) }}Y • {{ getPatientGender(visit) }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="visit-actions">
                    <button mat-button color="primary" (click)="viewVitals(visit._id)" [disabled]="isProcessing">
                      <mat-icon>visibility</mat-icon>
                      View Vitals
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Consultation Section -->
            <div class="section" *ngIf="!isLoading && !hasError && visitsByStatus.consultation_in_progress?.length > 0">
              <div class="section-header">
                <h3>
                  <mat-icon class="section-icon">medical_services</mat-icon>
                  With Doctor ({{ visitsByStatus.consultation_in_progress.length }})
                </h3>
                <span class="status-badge consultation-badge">Consultation</span>
              </div>
              
              <div class="visits-list">
                <div *ngFor="let visit of visitsByStatus.consultation_in_progress" class="visit-card consultation">
                  <div class="visit-header">
                    <div class="token-info">
                      <span class="token-badge">#{{ visit.tokenNumber || visit.token }}</span>
                      <span class="patient-name">{{ getPatientName(visit) }}</span>
                    </div>
                    <div class="doctor-info">
                      <mat-icon>medical_services</mat-icon>
                      <span>{{ getDoctorName(visit) }}</span>
                    </div>
                  </div>
                  
                  <div class="visit-details">
                    <div class="status-info">
                      <mat-icon>schedule</mat-icon>
                      <span>With doctor since: {{ calculateTimeElapsed(visit.updatedAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="!isLoading && !hasError && totalVisits === 0" class="empty-state">
              <mat-icon class="empty-icon">medical_services</mat-icon>
              <h3>No visits scheduled for today</h3>
              <p>All patients have been attended to. Great work!</p>
            </div>

            <!-- No Pending Visits -->
            <div *ngIf="!isLoading && !hasError && totalVisits > 0 && pendingVitalsCount === 0 && vitalsCompletedCount > 0" class="success-state">
              <mat-icon class="success-icon">check_circle</mat-icon>
              <h3>All vitals completed for today!</h3>
              <p>You have successfully completed all pending vitals measurements.</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats" *ngIf="!isLoading && !hasError">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Today's Statistics</mat-card-title>
            <button mat-icon-button (click)="showStatsHelp()">
              <mat-icon>help_outline</mat-icon>
            </button>
          </mat-card-header>
          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-card">
                <mat-icon class="stat-icon">people</mat-icon>
                <div class="stat-content">
                  <div class="stat-number">{{ totalVisits }}</div>
                  <div class="stat-label">Total Visits</div>
                </div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon">schedule</mat-icon>
                <div class="stat-content">
                  <div class="stat-number">{{ averageWaitTime }} min</div>
                  <div class="stat-label">Avg Wait Time</div>
                </div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon">emergency</mat-icon>
                <div class="stat-content">
                  <div class="stat-number">{{ emergencyCount }}</div>
                  <div class="stat-label">Emergencies</div>
                </div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon">done_all</mat-icon>
                <div class="stat-content">
                  <div class="stat-number">{{ efficiency }}%</div>
                  <div class="stat-label">Efficiency</div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .nurse-dashboard-container {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 10px;
    }

    .welcome-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .welcome-icon {
      margin-right: 10px;
      vertical-align: middle;
    }

    .stats-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }

    .stat-item {
      text-align: center;
      padding: 15px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    .stat-number {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .stat-number.highlight {
      color: #ff4081;
      animation: pulse 2s infinite;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }

    .quick-actions {
      margin-bottom: 20px;
    }

    .action-buttons {
      display: flex;
      gap: 15px;
    }

    .action-buttons button {
      flex: 1;
    }

    .today-visits {
      margin-bottom: 20px;
    }

    .header-badges {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-left: auto;
    }

    .shift-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .morning-shift {
      background: #fff3cd;
      color: #856404;
    }

    .evening-shift {
      background: #d1ecf1;
      color: #0c5460;
    }

    .last-updated {
      font-size: 12px;
      color: #666;
    }

    .section {
      margin-bottom: 30px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 12px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-header h3 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      color: #333;
    }

    .section-icon {
      color: #3f51b5;
    }

    .priority-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .high-priority {
      background: #f8d7da;
      color: #721c24;
    }

    .normal-priority {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      background: #e8f5e9;
      color: #2e7d32;
    }

    .visits-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 15px;
    }

    .visit-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .visit-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .visit-card.emergency {
      border-left: 4px solid #f44336;
      animation: emergency-pulse 1.5s infinite;
    }

    .visit-card.high {
      border-left: 4px solid #ff9800;
    }

    .visit-card.in-progress {
      border-left: 4px solid #2196f3;
    }

    .visit-card.completed {
      border-left: 4px solid #4caf50;
    }

    .visit-card.consultation {
      border-left: 4px solid #9c27b0;
    }

    .visit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .token-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .token-badge {
      background: #3f51b5;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
    }

    .visit-time {
      font-size: 12px;
      color: #666;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }

    .in-progress-badge {
      background: #e3f2fd;
      color: #1565c0;
    }

    .completed-badge {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .consultation-badge {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .completion-time, .time-elapsed {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #666;
    }

    .patient-info {
      margin-bottom: 15px;
    }

    .patient-details {
      margin-bottom: 10px;
    }

    .patient-name {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 5px;
    }

    .patient-demographics {
      font-size: 13px;
      color: #666;
    }

    .doctor-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #555;
    }

    .visit-details {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 15px;
      font-size: 13px;
      color: #666;
    }

    .visit-details > div {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .visit-actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .visit-actions button {
      flex: 1;
    }

    .empty-state, .loading-state, .error-state, .success-state {
      text-align: center;
      padding: 40px 20px;
    }

    .empty-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #bbb;
      margin-bottom: 15px;
    }

    .error-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #f44336;
      margin-bottom: 15px;
    }

    .success-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #4caf50;
      margin-bottom: 15px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
    }

    .quick-stats {
      margin-top: 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      background: #e9ecef;
    }

    .stat-icon {
      font-size: 32px;
      height: 32px;
      width: 32px;
      color: #3f51b5;
    }

    .stat-content {
      flex: 1;
    }

    .stat-content .stat-number {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 2px;
    }

    .stat-content .stat-label {
      font-size: 12px;
      color: #666;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }

    @keyframes emergency-pulse {
      0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
      100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
    }

    @media (max-width: 768px) {
      .visits-list {
        grid-template-columns: 1fr;
      }

      .stats-summary {
        grid-template-columns: repeat(2, 1fr);
      }

      .action-buttons {
        flex-direction: column;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .visit-actions {
        flex-direction: column;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
    }
  `]
})
export class NurseDashboardComponent implements OnInit, OnDestroy {
  private visitService = inject(VisitService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Visit data
  visitsByStatus: any = {
    waiting: [],
    vitals_in_progress: [],
    vitals_completed: [],
    consultation_in_progress: []
  };
  
  totalVisits = 0;
  pendingVitalsCount = 0;
  vitalsCompletedCount = 0;
  emergencyCount = 0;
  
  // UI state
  isLoading = false;
  isProcessing = false;
  showCompletedVisits = false;
  lastUpdated = new Date();
  hasError = false;
  errorMessage = '';
  
  // Statistics
  averageWaitTime = 0;
  efficiency = 0;
  currentShift = this.getCurrentShift();
  
  // Auto-refresh subscription
  private refreshSubscription?: Subscription;

  ngOnInit(): void {
    this.loadTodayVisits();
    
    // Auto-refresh every 60 seconds (instead of 30)
    this.refreshSubscription = interval(60000).subscribe(() => {
      if (!this.isLoading) {
        this.refreshVisits();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private getCurrentShift(): string {
    const hour = new Date().getHours();
    return hour < 12 ? 'Morning' : 'Evening';
  }

  loadTodayVisits(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    
    this.visitService.getTodayVisits().subscribe({
      next: (response) => {
        console.log('Visits API Response:', response); // Debug log
        
        if (response.success) {
          // Handle different API response formats
          if (response.data && typeof response.data === 'object') {
            // Format 1: Response has data object with status arrays
this.visitsByStatus = {
  waiting: [
    ...(response.data.registered || []),
    ...(response.data.waiting || [])
  ],
  vitals_in_progress: response.data.vitals_in_progress || [],
  vitals_completed: response.data.vitals_completed || [],
  consultation_in_progress: response.data.consultation_in_progress || []
};

          } else if (Array.isArray(response.data)) {
            // Format 2: Response has flat array, need to group by status
            this.groupVisitsByStatus(response.data);
          }
          
          // Calculate counts
          this.pendingVitalsCount = (this.visitsByStatus.waiting?.length || 0) + 
                                   (this.visitsByStatus.vitals_in_progress?.length || 0);
          this.vitalsCompletedCount = this.visitsByStatus.vitals_completed?.length || 0;
          
          // Calculate total visits
          this.totalVisits = this.pendingVitalsCount + this.vitalsCompletedCount;
          
          // Calculate emergency count
          this.emergencyCount = this.countEmergencies();
          
          // Calculate statistics
          this.calculateStatistics();
          
          this.lastUpdated = new Date();
          
          this.snackBar.open(`Loaded ${this.totalVisits} visits`, 'Close', { 
            duration: 2000,
            panelClass: ['success-snackbar']
          });
        } else {
          this.handleError(response.message || 'Failed to load visits');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading visits:', error);
        this.handleError(error.error?.message || 'Error loading visits');
        this.isLoading = false;
      }
    });
  }

private groupVisitsByStatus(visits: any[]): void {
  this.visitsByStatus = {
    waiting: visits.filter(v =>
      v.visitStatus === 'Registered' ||
      v.visitStatus === 'Waiting' ||
      v.visitStatus === 'Vitals_Pending'
    ),

    vitals_in_progress: visits.filter(v =>
      v.visitStatus === 'Vitals_In_Progress' ||
      v.visitStatus === 'Nurse_Assessment'
    ),

    vitals_completed: visits.filter(v =>
      v.visitStatus === 'Vitals_Completed' ||
      v.visitStatus === 'Ready_For_Consultation'
    ),

    consultation_in_progress: visits.filter(v =>
      v.visitStatus === 'Consultation_In_Progress' ||
      v.visitStatus === 'Doctor_Assessment'
    )
  };
}



  private countEmergencies(): number {
    let count = 0;
    ['waiting', 'vitals_in_progress'].forEach(status => {
      if (this.visitsByStatus[status]) {
        count += this.visitsByStatus[status].filter((v: any) => 
          v.priority === 'Emergency' || v.priority === 'High'
        ).length;
      }
    });
    return count;
  }

  private calculateStatistics(): void {
    // Calculate efficiency
    const totalAttended = this.vitalsCompletedCount;
    const totalPatients = this.totalVisits;
    
    if (totalPatients > 0) {
      this.efficiency = Math.round((totalAttended / totalPatients) * 100);
    } else {
      this.efficiency = 0;
    }
    
    // Calculate average wait time (simplified)
    // This would ideally come from the server
    const totalWaitTime = this.pendingVitalsCount * 15; // Assuming 15 minutes average per patient
    this.averageWaitTime = this.pendingVitalsCount > 0 ? 
      Math.round(totalWaitTime / this.pendingVitalsCount) : 0;
  }

getPatientName(visit: any): string {
  return visit.patientId?.fullName || visit.patient?.fullName || 'Unknown';
}

getPatientAge(visit: any): any {
  return visit.patientId?.age || visit.patient?.age || 'N/A';
}

getPatientGender(visit: any): string {
  return visit.patientId?.gender || visit.patient?.gender || 'N/A';
}


  getDoctorName(visit: any): string {
    if (visit.doctor?.name) return visit.doctor.name;
    if (visit.doctorName) return visit.doctorName;
    if (visit.doctorId?.name) return visit.doctorId.name;
    return '';
  }

  getPatientType(visit: any): string {
    if (visit.patient?.patientType) return visit.patient.patientType;
    if (visit.patientType) return visit.patientType;
    if (visit.patientId?.patientType) return visit.patientId.patientType;
    return '';
  }

  calculateTimeElapsed(dateString: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} mins ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hours ago`;
    }
  }

  refreshVisits(): void {
    this.loadTodayVisits();
  }

startVitals(visitId: string): void {
  if (!visitId) {
    this.snackBar.open('Invalid visit ID', 'Close', { duration: 3000 });
    return;
  }
  
  this.isProcessing = true;
  this.visitService.updateVisitStatus(visitId, 'Vitals_In_Progress').subscribe({
    next: (response) => {
      if (response.success) {
        this.snackBar.open('Starting vitals measurement...', 'Close', { 
          duration: 2000,
          panelClass: ['success-snackbar']
        });
        // Navigate to vitals entry page
        setTimeout(() => {
          this.router.navigate(['/nurse/vitals', visitId]);
          this.isProcessing = false;
        }, 1000);
      } else {
        this.snackBar.open(response.message, 'Close', { duration: 3000 });
        this.isProcessing = false;
      }
    },
    error: (error) => {
      console.error('Error starting vitals:', error);
      this.snackBar.open('Error starting vitals measurement', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      this.isProcessing = false;
    }
  });
}

  continueVitals(visitId: string): void {
    this.router.navigate(['/nurse/vitals', visitId]);
  }

  markAsCompleted(visitId: string): void {
    if (!visitId) {
      this.snackBar.open('Invalid visit ID', 'Close', { duration: 3000 });
      return;
    }
    
    this.isProcessing = true;
    this.visitService.updateVisitStatus(visitId, 'Vitals_Completed').subscribe({
      next: () => {
        this.snackBar.open('Vitals marked as completed', 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.refreshVisits();
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error marking vitals as completed:', error);
        this.snackBar.open('Error updating vitals status', 'Close', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isProcessing = false;
      }
    });
  }

  viewVitals(visitId: string): void {
    this.router.navigate(['/nurse/vitals/view', visitId]);
  }

  printVitals(visitId: string): void {
    // This would open a print dialog for vitals
    window.open(`/nurse/vitals/print/${visitId}`, '_blank');
  }

  viewPatientDetails(visit: any): void {
    // Show patient details in a dialog or navigate
    const patientId = visit.patient?._id || visit.patientId?._id || visit.patientId;
    if (patientId) {
      // Open patient details modal or navigate
      this.snackBar.open(`Viewing details for ${this.getPatientName(visit)}`, 'Close', { 
        duration: 2000 
      });
      // You can implement a modal here
    } else {
      this.snackBar.open('Patient details not available', 'Close', { duration: 3000 });
    }
  }

  toggleCompletedVisits(): void {
    this.showCompletedVisits = !this.showCompletedVisits;
  }

  printReport(): void {
    window.print();
  }

  showStatsHelp(): void {
    this.snackBar.open('Statistics are calculated based on today\'s visits', 'Close', { 
      duration: 4000 
    });
  }

  private handleError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.snackBar.open(message, 'Close', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}