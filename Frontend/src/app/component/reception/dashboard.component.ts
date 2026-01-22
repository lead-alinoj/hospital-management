// components/reception/dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { VisitService } from '../../service/visit.service';
import { TodayVisitsResponse } from '../../models/visit.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-reception-dashboard',
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
    MatSnackBarModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule
],
  template: `
    <div class="dashboard-container">
      <!-- Quick Actions -->
      <div class="quick-actions">
        <mat-card class="action-card">
          <mat-card-header>
            <mat-card-title>Quick Actions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-buttons">
              <button mat-raised-button color="primary" routerLink="/reception/patient/register">
                <mat-icon>person_add</mat-icon>
                New Patient
              </button>
              <button mat-raised-button color="accent" routerLink="/reception/visit/create">
                <mat-icon>add_circle</mat-icon>
                New Visit
              </button>
              <button mat-raised-button color="primary" routerLink="/reception/patient/search">
                <mat-icon>search</mat-icon>
                Search Patient
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Today's Visits Overview -->
      <div class="visits-overview">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Today's Visits Summary</mat-card-title>
            <span class="total-count">{{ totalVisits }} visits today</span>
          </mat-card-header>

          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-card" [ngClass]="getStatusClass('registered')">
                <div class="stat-number">{{ visitSummary.registered || 0 }}</div>
                <div class="stat-label">Registered</div>
              </div>
              <div class="stat-card" [ngClass]="getStatusClass('waiting')">
                <div class="stat-number">{{ visitSummary.waiting || 0 }}</div>
                <div class="stat-label">Waiting</div>
              </div>
              <div class="stat-card" [ngClass]="getStatusClass('vitals_in_progress')">
                <div class="stat-number">{{ visitSummary.vitals_in_progress || 0 }}</div>
                <div class="stat-label">Vitals In Progress</div>
              </div>
              <div class="stat-card" [ngClass]="getStatusClass('vitals_completed')">
                <div class="stat-number">{{ visitSummary.vitals_completed || 0 }}</div>
                <div class="stat-label">Vitals Done</div>
              </div>
              <div class="stat-card" [ngClass]="getStatusClass('consultation_completed')">
                <div class="stat-number">{{ visitSummary.consultation_completed || 0 }}</div>
                <div class="stat-label">Consultation Done</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Recent Visits -->
      <div class="recent-visits">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Recent Visits</mat-card-title>
            <button mat-button color="primary" (click)="refreshVisits()">
              <mat-icon>refresh</mat-icon>
              Refresh
            </button>
          </mat-card-header>

          <mat-card-content>
<mat-tab-group animationDuration="0ms">
             <mat-tab label="Waiting for Nurse">
  <div class="visits-list">
    <div *ngFor="let visit of visits.waitingForNurse" class="visit-item">
      <div class="visit-info">
        <span class="token">{{ visit.tokenNumber }}</span>
        <span class="patient-name">{{ visit.patient?.fullName || 'N/A' }}</span>
        <span class="doctor">{{ visit.doctor?.name || 'N/A' }}</span>
      </div>
      <div class="visit-actions">
        <button mat-button color="primary" (click)="viewVisit(visit._id)">
          View
        </button>
      </div>
    </div>
  </div>
</mat-tab>


              <mat-tab label="Vitals Completed">
                <div class="visits-list">
                  <div *ngFor="let visit of visits.vitals_completed" class="visit-item">
                    <div class="visit-info">
                      <span class="token">{{ visit.tokenNumber }}</span>
                      <span class="patient-name">{{ visit.patient?.fullName }}</span>
                      <span class="doctor">{{ visit.doctor?.name }}</span>
                    </div>
                    <div class="visit-actions">
                      <button mat-button color="primary" (click)="viewVisit(visit._id)">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card-content>
        </mat-card>
      </div>
      <div *ngIf="selectedVisit" class="visit-details-card">
  <mat-card>
    <mat-card-header>
      <mat-card-title>Visit Details</mat-card-title>
      <mat-card-subtitle>Token: {{ selectedVisit.tokenNumber }}</mat-card-subtitle>
    </mat-card-header>
    <mat-card-content>
      <p><strong>Patient:</strong> {{ selectedVisit.patient?.fullName }}</p>
      <p><strong>Doctor:</strong> {{ selectedVisit.doctor?.name }}</p>
      <p><strong>Visit Type:</strong> {{ selectedVisit.visitType }}</p>
      <p><strong>Priority:</strong> {{ selectedVisit.priority }}</p>
      <p><strong>Chief Complaint:</strong> {{ selectedVisit.chiefComplaint }}</p>
      <p><strong>Status:</strong> {{ selectedVisit.visitStatus }}</p>

      <!-- Update Form -->
      <form [formGroup]="visitForm" class="update-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Doctor</mat-label>
          <mat-select formControlName="doctorId">
            <mat-option *ngFor="let doctor of availableDoctors" [value]="doctor._id">
              {{ doctor.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Priority</mat-label>
          <mat-select formControlName="priority">
            <mat-option value="Normal">Normal</mat-option>
            <mat-option value="High">High</mat-option>
            <mat-option value="Emergency">Emergency</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Visit Type</mat-label>
          <mat-select formControlName="visitType">
            <mat-option value="OP">Out Patient (OP)</mat-option>
            <mat-option value="IP">In Patient (IP)</mat-option>
            <mat-option value="FollowUp">Follow-up</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Chief Complaint</mat-label>
          <textarea matInput formControlName="chiefComplaint" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-card-content>
    <mat-card-actions>
      <button mat-button color="primary" (click)="updateVisit()">Update</button>
      <button mat-button color="warn" (click)="deleteVisit(selectedVisit)">Delete</button>
      <button mat-button (click)="selectedVisit=null">Close</button>
    </mat-card-actions>
  </mat-card>
</div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .quick-actions {
      margin-bottom: 20px;
    }
    .action-buttons {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }
    .action-buttons button {
      flex: 1;
      min-width: 200px;
      height: 80px;
      font-size: 16px;
    }
    .action-buttons mat-icon {
      margin-right: 10px;
      font-size: 24px;
    }
    .visits-overview {
      margin-bottom: 20px;
    }
    .total-count {
      margin-left: auto;
      font-weight: 500;
      color: #3f51b5;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .stat-card {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      color: white;
      transition: transform 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-5px);
    }
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }
    .status-registered { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .status-waiting { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .status-vitals_in_progress { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    .status-vitals_completed { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
    .status-consultation_completed { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
    .recent-visits {
      margin-bottom: 20px;
    }
    .visits-list {
      max-height: 400px;
      overflow-y: auto;
    }
    .visit-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    .visit-info {
      display: flex;
      gap: 20px;
      align-items: center;
    }
    .token {
      background: #3f51b5;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: bold;
    }
    .patient-name {
      font-weight: 500;
      min-width: 200px;
    }
    .doctor {
      color: #666;
      font-size: 14px;
    }
    .visit-details-card {
  margin-top: 20px;
}
.update-form mat-form-field {
  margin-bottom: 15px;
}

    @media (max-width: 768px) {
      .action-buttons button {
        min-width: 100%;
      }
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .visit-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }
    }
  `]
})
export class ReceptionDashboardComponent implements OnInit {
    private fb = inject(FormBuilder);
  private visitService = inject(VisitService);
  private router = inject(Router); // Add this line
  snackBar = inject(MatSnackBar); 
  visits: any = {};
  visitSummary: any = {};
  totalVisits = 0;
selectedVisit: any = null; // Visit selected for view/update/delete
visitForm!: FormGroup;      // Form for updating a visit
availableDoctors: any[] = [];
isUpdating = false;

  ngOnInit(): void {
    this.loadTodayVisits();
  }

private loadTodayVisits(): void {
  this.visitService.getTodayVisits().subscribe({
    next: (response: any) => {
      if (response.success) {
        // Flatten and merge status for “Waiting for Nurse”
        this.visits = response.data;
        this.visits.waitingForNurse = [
          ...(this.visits.registered || []),
          ...(this.visits.waiting || [])
        ];
        this.visits.vitals_completed = response.data.vitals_completed || [];
        this.visitSummary = response.summary.byStatus;
        this.totalVisits = response.summary.total;
      } else {
        console.error('Failed to load visits:', response.message);
      }
    },
    error: (err) => {
      console.error('Error loading visits:', err);
      this.snackBar.open('Error loading visits', 'Close', { duration: 3000 });
    }
  });
}

updateVisit(): void {
  if (!this.selectedVisit || this.visitForm.invalid) return;

  this.isUpdating = true;
  const updatedData = this.visitForm.value;

  this.visitService.updateVisitStatus(this.selectedVisit._id, updatedData.visitStatus || this.selectedVisit.visitStatus)
    .subscribe({
      next: (res: any) => {
        this.snackBar.open(res.message || 'Visit updated', 'Close', { duration: 3000 });
        this.selectedVisit = null;
        this.loadTodayVisits();
        this.isUpdating = false;
      },
      error: (err) => {
        console.error('Error updating visit:', err);
        this.snackBar.open(err.error?.message || 'Error updating visit', 'Close', { duration: 3000 });
        this.isUpdating = false;
      }
    });
}
deleteVisit(visit: any): void {
  if (!confirm('Are you sure you want to delete this visit?')) return;

  this.visitService.deleteVisit(visit._id).subscribe({
    next: (res: any) => {
      this.snackBar.open(res.message || 'Visit deleted', 'Close', { duration: 3000 });
      this.selectedVisit = null;
      this.loadTodayVisits();
    },
    error: (err) => {
      console.error('Error deleting visit:', err);
      this.snackBar.open(err.error?.message || 'Error deleting visit', 'Close', { duration: 3000 });
    }
  });
}



  getStatusClass(status: string): string {
    return `status-${status}`;
  }

 viewVisit(visit: any): void {
  this.selectedVisit = visit;

  // Initialize the update form
  this.visitForm = this.fb.group({
    doctorId: [visit.doctor?._id || '', Validators.required],
    visitType: [visit.visitType || 'OP', Validators.required],
    priority: [visit.priority || 'Normal'],
    chiefComplaint: [visit.chiefComplaint || ''],
    shift: [visit.shift || 'Morning']
  });

  // Load doctors for assignment
  this.visitService.getDoctors().subscribe({
    next: (res: any) => {
      this.availableDoctors = res.data || [];
    },
    error: (err) => console.error(err)
  });
}

navigateToPatientRegister(): void {
  console.log('Navigating to patient registration...');
  this.router.navigate(['/reception/patient/register']);
}
  refreshVisits(): void {
    this.loadTodayVisits();
  }
}