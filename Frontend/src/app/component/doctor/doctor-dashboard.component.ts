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

      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <mat-icon class="header-icon">medical_services</mat-icon>
          <div>
            <h1>Doctor Dashboard</h1>
            <p>Your daily consultation overview</p>
          </div>
        </div>
      </div>

      <!-- PENDING CONSULTATIONS -->
      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon color="primary">schedule</mat-icon>
            Pending Consultations
          </mat-card-title>
          <mat-card-subtitle>
            Patients waiting after vitals completion
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>

          <div *ngIf="isLoading" class="state-box">
            <mat-icon class="spin">autorenew</mat-icon>
            Loading patients...
          </div>

          <div *ngIf="!isLoading && pendingVisits.length === 0" class="state-box">
            <mat-icon color="primary">check_circle</mat-icon>
            <p>No patients waiting</p>
          </div>

          <div class="visits-grid" *ngIf="pendingVisits.length > 0">
            <mat-card
              *ngFor="let visit of pendingVisits"
              class="patient-card"
              [routerLink]="['/doctor/consultation', visit._id]"
            >

              <div class="patient-top">
                <div class="name">
                  <mat-icon>person</mat-icon>
                  {{ visit.patient?.fullName }}
                </div>

                <mat-chip color="accent" selected>
                  <mat-icon>confirmation_number</mat-icon>
                  {{ visit.tokenNumber }}
                </mat-chip>
              </div>

              <div class="patient-body">
                <div class="info">
                  <mat-icon>badge</mat-icon>
                  OP: {{ visit.patient?.opNumber }}
                </div>

                <div class="info">
                  <mat-icon>cake</mat-icon>
                  {{ visit.patient?.age }}Y / {{ visit.patient?.gender }}
                </div>

                <div class="info">
                  <mat-icon>calendar_today</mat-icon>
                  {{ visit.visitDate | date:'mediumDate' }}
                </div>

                <div class="info complaint">
                  <mat-icon>report_problem</mat-icon>
                  {{ visit.chiefComplaint }}
                </div>

                <div class="info">
                  <mat-icon color="primary">monitor_heart</mat-icon>
                  Vitals Completed
                </div>

                <div class="priority"
                  [class.high]="visit.priority === 'High'"
                  [class.normal]="visit.priority === 'Normal'"
                  [class.low]="visit.priority === 'Low'">
                  <mat-icon>priority_high</mat-icon>
                  {{ visit.priority }}
                </div>
              </div>

              <button mat-raised-button color="primary" class="full-btn">
                <mat-icon>stethoscope</mat-icon>
                Start Consultation
              </button>

            </mat-card>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- CONSULTED PATIENTS -->
      <mat-card class="dashboard-card" *ngIf="consultedVisits.length > 0">
        <mat-card-header>
          <mat-card-title>
            <mat-icon color="primary">history</mat-icon>
            My Consulted Patients
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <table mat-table [dataSource]="consultedVisits" class="mat-elevation-z1 responsive-table">

            <ng-container matColumnDef="patient">
              <th mat-header-cell *matHeaderCellDef>Patient</th>
              <td mat-cell *matCellDef="let v">
                <strong>{{ v.patient?.fullName }}</strong>
                <div class="muted">OP: {{ v.patient?.opNumber }}</div>
              </td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let v">
                {{ v.consultationTime | date:'mediumDate' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="diagnosis">
              <th mat-header-cell *matHeaderCellDef>Diagnosis</th>
              <td mat-cell *matCellDef="let v">
                {{ v.diagnosis || '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Action</th>
              <td mat-cell *matCellDef="let v">
                <button mat-stroked-button color="primary"
                  [routerLink]="['/doctor/consultation', v._id]">
                  <mat-icon>visibility</mat-icon>
                  View
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="['patient','date','diagnosis','actions']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['patient','date','diagnosis','actions']"></tr>

          </table>
        </mat-card-content>
      </mat-card>

    </div>
  `,
  styles: [`
    .doctor-dashboard {
      padding: 20px;
      max-width: 1200px;
      margin: auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }

    .header-left {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .header-icon {
      font-size: 48px;
      color: #1976d2;
    }

    .dashboard-card {
      margin-bottom: 30px;
      border-radius: 16px;
    }

    .visits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .patient-card {
      padding: 16px;
      border-radius: 16px;
      transition: transform 0.3s, box-shadow 0.3s;
      cursor: pointer;
    }

    .patient-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 25px rgba(0,0,0,0.12);
    }

    .patient-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .name {
      font-size: 18px;
      font-weight: 600;
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .patient-body {
      display: grid;
      gap: 8px;
      font-size: 14px;
      margin-bottom: 15px;
    }

    .info {
      display: flex;
      gap: 6px;
      align-items: center;
      color: #555;
    }

    .complaint {
      color: #e65100;
      font-weight: 500;
    }

    .priority {
      display: flex;
      gap: 6px;
      align-items: center;
      font-weight: 600;
    }

    .priority.high { color: #d32f2f; }
    .priority.normal { color: #1976d2; }
    .priority.low { color: #388e3c; }

    .full-btn {
      width: 100%;
      border-radius: 12px;
    }

    .state-box {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .spin {
      animation: spin 1.2s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0); }
      to { transform: rotate(360deg); }
    }

    .responsive-table {
      width: 100%;
    }

    .muted {
      font-size: 12px;
      color: #777;
    }

    @media (max-width: 768px) {
      .header-left h1 {
        font-size: 20px;
      }
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
    url.includes('/doctor/patients')
      ? this.loadConsultedPatients()
      : this.loadPendingConsultations();
  }

  private loadConsultedPatients(): void {
    this.visitService.getDoctorConsultedPatients().subscribe({
      next: (res: any) => this.consultedVisits = res.data || [],
      error: () => this.consultedVisits = []
    });
  }

  private loadPendingConsultations(): void {
    this.isLoading = true;
    this.visitService.getPendingConsultation().subscribe({
      next: (res: any) => {
        this.pendingVisits = res.data || res;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }
}
