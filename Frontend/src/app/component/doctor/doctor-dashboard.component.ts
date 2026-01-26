// doctor/dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { VisitService } from '../../service/visit.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule
  ],
  template: `
    <div class="doctor-dashboard">
      <h1>Doctor Dashboard</h1>
      
      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-card-title>Patients Pending Consultation</mat-card-title>
          <mat-card-subtitle>Patients with completed vitals waiting for doctor</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div *ngIf="isLoading" class="loading">
            Loading patients...
          </div>
          
          <div *ngIf="!isLoading && pendingVisits.length === 0" class="no-data">
            <mat-icon>check_circle</mat-icon>
            <p>No patients pending consultation</p>
          </div>
          
          <div class="visits-grid" *ngIf="pendingVisits.length > 0">
            <mat-card *ngFor="let visit of pendingVisits" class="patient-card" 
              [routerLink]="['/doctor/consultation', visit._id]">
              
              <mat-card-header>
                <div class="patient-header">
                  <div class="patient-name">{{ visit.patient?.fullName }}</div>
                  <mat-chip color="primary" highlighted>
                    Token: {{ visit.tokenNumber }}
                  </mat-chip>
                </div>
              </mat-card-header>
              
              <mat-card-content>
                <div class="patient-info">
                  <div class="info-row">
                    <span class="label">Age/Gender:</span>
                    <span>{{ visit.patient?.age }}Y / {{ visit.patient?.gender }}</span>
                  </div>
                  <div class="info-row">
  <span class="label">Visit Date:</span>
  <span>
    {{ visit.visitDate | date:'mediumDate' }}
  </span>
</div>

                  <div class="info-row">
                    <span class="label">OP Number:</span>
                    <span>{{ visit.patient?.opNumber }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Chief Complaint:</span>
                    <span class="complaint">{{ visit.chiefComplaint }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Vitals Completed:</span>
                    <mat-icon color="primary" *ngIf="visit.vitals">check_circle</mat-icon>
                    <span *ngIf="visit.vitals">Yes</span>
                    <span *ngIf="!visit.vitals">No</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Priority:</span>
                    <span [ngClass]="{
                      'priority-high': visit.priority === 'High',
                      'priority-normal': visit.priority === 'Normal',
                      'priority-low': visit.priority === 'Low'
                    }">
                      {{ visit.priority }}
                    </span>
                  </div>
                </div>
              </mat-card-content>
              
              <mat-card-actions>
                <button mat-raised-button color="primary" class="consult-btn">
                  <mat-icon>medical_services</mat-icon>
                  Start Consultation
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Today's Consulted Patients -->
    <mat-card class="dashboard-card" *ngIf="consultedVisits.length > 0">
  <mat-card-header>
    <mat-card-title>My Patients</mat-card-title>
    <mat-card-subtitle>
      Patients you have already consulted
    </mat-card-subtitle>
  </mat-card-header>

  <mat-card-content>
    <table mat-table [dataSource]="consultedVisits" class="mat-elevation-z1">

      <!-- Patient -->
      <ng-container matColumnDef="patient">
        <th mat-header-cell *matHeaderCellDef>Patient</th>
        <td mat-cell *matCellDef="let v">
          {{ v.patient?.fullName }} <br />
          <small>OP: {{ v.patient?.opNumber }}</small>
        </td>
      </ng-container>

      <!-- Date -->
      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef>Date</th>
        <td mat-cell *matCellDef="let v">
          {{ v.consultationTime | date:'mediumDate' }}
        </td>
      </ng-container>

      <!-- Diagnosis -->
      <ng-container matColumnDef="diagnosis">
        <th mat-header-cell *matHeaderCellDef>Diagnosis</th>
        <td mat-cell *matCellDef="let v">
          {{ v.diagnosis || '—' }}
        </td>
      </ng-container>

      <!-- Actions -->
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let v">
          <button mat-button color="primary"
            [routerLink]="['/doctor/consultation', v._id]">
            View
          </button>
        </td>
      </ng-container>

      <tr mat-header-row
        *matHeaderRowDef="['patient','date','diagnosis','actions']">
      </tr>
      <tr mat-row
        *matRowDef="let row; columns: ['patient','date','diagnosis','actions'];">
      </tr>

    </table>
  </mat-card-content>
</mat-card>

    </div>
  `,
  styles: [`
    .doctor-dashboard {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .dashboard-card {
      margin-bottom: 30px;
    }
    .visits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .patient-card {
      cursor: pointer;
      transition: transform 0.2s;
    }
    .patient-card:hover {
      transform: translateY(-5px);
    }
    .patient-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .patient-name {
      font-size: 18px;
      font-weight: 500;
    }
    .patient-info {
      padding: 10px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: 500;
      color: #666;
    }
    .complaint {
      color: #e65100;
      font-weight: 500;
    }
    .consult-btn {
      width: 100%;
    }
    .priority-high {
      color: #f44336;
      font-weight: bold;
    }
    .priority-normal {
      color: #2196f3;
    }
    .priority-low {
      color: #4caf50;
    }
    .loading, .no-data {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    .no-data mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 15px;
      color: #4caf50;
    }
  `]
})
export class DoctorDashboardComponent implements OnInit {
  private visitService = inject(VisitService);
  
  pendingVisits: any[] = [];
  consultedVisits: any[] = [];
  isLoading = false;
  
ngOnInit(): void {
  const url = window.location.pathname;

  if (url.includes('/doctor/patients')) {
    this.loadConsultedPatients();
  } else {
    this.loadPendingConsultations();
  }
}

  private loadConsultedPatients(): void {
  this.visitService.getDoctorConsultedPatients().subscribe({
    next: (res: any) => {
      this.consultedVisits = res.data || [];
    },
    error: (err) => {
      console.error('Consulted patients error', err);
      this.consultedVisits = [];
    }
  });
}

  private loadPendingConsultations(): void {
    this.isLoading = true;
    
    this.visitService.getPendingConsultation().subscribe({
      next: (response: any) => {
        this.pendingVisits = response.data || response;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending consultations:', error);
        this.isLoading = false;
      }
    });
  }
}