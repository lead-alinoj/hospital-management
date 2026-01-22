// components/nurse/vitals-view.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { VitalsService } from '../../service/vitals.service';
import { VisitService } from '../../service/visit.service';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-vitals-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule
],
  template: `
    <div class="vitals-view-container">
      <!-- Patient Header -->
      <mat-card class="patient-header">
        <div class="patient-info">
          <div class="info-row">
            <span class="label">Token:</span>
            <span class="value token-badge">{{ visit?.tokenNumber }}</span>
          </div>
          <div class="info-row">
            <span class="label">Patient:</span>
            <span class="value">{{ visit?.patient?.fullName }}</span>
          </div>
          <div class="info-row">
            <span class="label">Age/Gender:</span>
            <span class="value">{{ visit?.patient?.age }}Y / {{ visit?.patient?.gender }}</span>
          </div>
          <div class="info-row">
            <span class="label">Recorded:</span>
            <span class="value">{{ vitals?.recordedAt | date:'medium' }}</span>
          </div>
        </div>
      </mat-card>

      <!-- Vitals Details -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Vitals Record</mat-card-title>
          <mat-card-subtitle>Detailed measurements</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Basic Measurements -->
          <div class="section-title">Basic Measurements</div>
          <div class="measurement-grid">
            <div class="measurement-card" *ngIf="vitals?.height?.value">
              <mat-icon class="measurement-icon">straighten</mat-icon>
              <div class="measurement-content">
                <div class="measurement-value">{{ vitals.height.value }} {{ vitals.height.unit }}</div>
                <div class="measurement-label">Height</div>
              </div>
            </div>

            <div class="measurement-card" *ngIf="vitals?.weight?.value">
              <mat-icon class="measurement-icon">scale</mat-icon>
              <div class="measurement-content">
                <div class="measurement-value">{{ vitals.weight.value }} {{ vitals.weight.unit }}</div>
                <div class="measurement-label">Weight</div>
              </div>
            </div>

            <div class="measurement-card" *ngIf="vitals?.bmi">
              <mat-icon class="measurement-icon">monitor_weight</mat-icon>
              <div class="measurement-content">
                <div class="measurement-value" [ngClass]="getBMIClass(vitals.bmi)">
                  {{ vitals.bmi | number:'1.1-1' }}
                </div>
                <div class="measurement-label">BMI ({{ getBMICategory(vitals.bmi) }})</div>
              </div>
            </div>
          </div>

          <!-- Vital Signs -->
          <div class="section-title">Vital Signs</div>
          <div class="measurement-grid">
            <div class="measurement-card" *ngIf="vitals?.bloodPressure?.systolic && vitals?.bloodPressure?.diastolic">
              <mat-icon class="measurement-icon">favorite</mat-icon>
              <div class="measurement-content">
                <div class="measurement-value" [ngClass]="getBPClass(vitals.bloodPressure)">
                  {{ vitals.bloodPressure.systolic }}/{{ vitals.bloodPressure.diastolic }} mmHg
                </div>
                <div class="measurement-label">Blood Pressure</div>
                <div class="measurement-status">{{ getBPStatus(vitals.bloodPressure) }}</div>
              </div>
            </div>

            <div class="measurement-card" *ngIf="vitals?.pulse?.value">
              <mat-icon class="measurement-icon">favorite_border</mat-icon>
              <div class="measurement-content">
                <div class="measurement-value" [ngClass]="getPulseClass(vitals.pulse.value)">
                  {{ vitals.pulse.value }} {{ vitals.pulse.unit }}
                </div>
                <div class="measurement-label">Pulse Rate</div>
              </div>
            </div>

            <div class="measurement-card" *ngIf="vitals?.temperature?.value">
              <mat-icon class="measurement-icon">thermostat</mat-icon>
              <div class="measurement-content">
                <div class="measurement-value" [ngClass]="getTemperatureClass(vitals.temperature.value)">
                  {{ vitals.temperature.value }} {{ vitals.temperature.unit }}
                </div>
                <div class="measurement-label">Temperature</div>
              </div>
            </div>

            <div class="measurement-card" *ngIf="vitals?.spo2?.value">
              <mat-icon class="measurement-icon">air</mat-icon>
              <div class="measurement-content">
                <div class="measurement-value" [ngClass]="getSpO2Class(vitals.spo2.value)">
                  {{ vitals.spo2.value }} {{ vitals.spo2.unit }}
                </div>
                <div class="measurement-label">SpO₂</div>
              </div>
            </div>

            <div class="measurement-card" *ngIf="vitals?.respiratoryRate?.value">
              <mat-icon class="measurement-icon">respiratory_rate</mat-icon>
              <div class="measurement-content">
                <div class="measurement-value">{{ vitals.respiratoryRate.value }} {{ vitals.respiratoryRate.unit }}</div>
                <div class="measurement-label">Respiratory Rate</div>
              </div>
            </div>
          </div>

          <!-- Blood Sugar -->
          <div *ngIf="vitals?.bloodSugar?.value" class="section-title">Blood Sugar</div>
          <div class="measurement-grid" *ngIf="vitals?.bloodSugar?.value">
            <div class="measurement-card">
              <mat-icon class="measurement-icon">bloodtype</mat-icon>
              <div class="measurement-content">
                <div class="measurement-value" [ngClass]="getBloodSugarClass(vitals.bloodSugar.value)">
                  {{ vitals.bloodSugar.value }} mg/dL
                </div>
                <div class="measurement-label">Blood Sugar ({{ vitals.bloodSugar.type || 'Random' }})</div>
              </div>
            </div>
          </div>

          <!-- Remarks -->
          <div *ngIf="vitals?.remarks" class="section-title">Remarks</div>
          <mat-card *ngIf="vitals?.remarks" class="remarks-card">
            <mat-card-content>
              <p>{{ vitals.remarks }}</p>
            </mat-card-content>
          </mat-card>

          <!-- Recorded Information -->
          <div class="section-title">Record Information</div>
          <mat-card class="info-card">
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <mat-icon class="info-icon">person</mat-icon>
                  <div class="info-content">
                    <div class="info-label">Recorded By</div>
                    <div class="info-value">{{ vitals?.recordedBy?.name || 'Nurse' }}</div>
                  </div>
                </div>
                <div class="info-item">
                  <mat-icon class="info-icon">schedule</mat-icon>
                  <div class="info-content">
                    <div class="info-label">Recorded At</div>
                    <div class="info-value">{{ vitals?.recordedAt | date:'medium' }}</div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- No Vitals -->
          <div *ngIf="!vitals && !isLoading" class="no-data">
            <mat-icon class="no-data-icon">info</mat-icon>
            <h3>No Vitals Recorded</h3>
            <p>Vitals have not been recorded for this visit yet.</p>
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoading" class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading vitals data...</p>
          </div>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back to Dashboard
          </button>
          <button mat-raised-button color="primary" (click)="editVitals()" *ngIf="vitals">
            <mat-icon>edit</mat-icon>
            Edit Vitals
          </button>
          <button mat-raised-button color="accent" (click)="printVitals()" *ngIf="vitals">
            <mat-icon>print</mat-icon>
            Print
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .vitals-view-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .patient-header {
      margin-bottom: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .patient-info {
      display: flex;
      flex-wrap: wrap;
      gap: 30px;
      padding: 20px;
    }

    .info-row {
      display: flex;
      flex-direction: column;
    }

    .label {
      font-size: 12px;
      opacity: 0.8;
      margin-bottom: 4px;
    }

    .value {
      font-size: 16px;
      font-weight: 500;
    }

    .token-badge {
      background: white;
      color: #3f51b5;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: bold;
    }

    .section-title {
      font-size: 18px;
      font-weight: 500;
      margin: 30px 0 20px 0;
      color: #3f51b5;
      border-bottom: 2px solid #3f51b5;
      padding-bottom: 8px;
    }

    .measurement-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .measurement-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.1);
      border-left: 4px solid #3f51b5;
      display: flex;
      align-items: center;
      gap: 15px;
      transition: transform 0.2s;
    }

    .measurement-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    }

    .measurement-icon {
      font-size: 32px;
      height: 32px;
      width: 32px;
      color: #3f51b5;
    }

    .measurement-content {
      flex: 1;
    }

    .measurement-value {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .measurement-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }

    .measurement-status {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
      background: #f5f5f5;
      display: inline-block;
    }

    /* Status Classes */
    .normal { color: #4caf50; }
    .warning { color: #ff9800; }
    .danger { color: #f44336; }
    .critical { color: #d32f2f; font-weight: bold; }

    .remarks-card {
      margin-bottom: 30px;
      background: #fff8e1;
    }

    .info-card {
      margin-bottom: 30px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .info-icon {
      color: #666;
    }

    .info-content {
      flex: 1;
    }

    .info-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 2px;
    }

    .info-value {
      font-size: 16px;
      font-weight: 500;
    }

    .no-data {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-data-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      margin-bottom: 20px;
      color: #bbb;
    }

    .loading-state {
      text-align: center;
      padding: 60px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    mat-card-actions {
      padding: 16px !important;
      border-top: 1px solid #eee;
    }

    @media (max-width: 768px) {
      .measurement-grid {
        grid-template-columns: 1fr;
      }

      .patient-info {
        flex-direction: column;
        gap: 15px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class VitalsViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vitalsService = inject(VitalsService);
  private visitService = inject(VisitService);
  private snackBar = inject(MatSnackBar);

  visit: any = null;
  vitals: any = null;
  isLoading = false;

  ngOnInit(): void {
    this.loadVisitData();
  }

  private loadVisitData(): void {
    const visitId = this.route.snapshot.paramMap.get('visitId');
    if (visitId) {
      this.isLoading = true;
      
      // Load visit details
      this.visitService.getVisitById(visitId).subscribe({
        next: (response) => {
          this.visit = response.data;
          this.loadVitals();
        },
        error: (error) => {
          console.error('Error loading visit:', error);
          this.showError('Error loading visit data');
          this.isLoading = false;
        }
      });
    }
  }

  private loadVitals(): void {
    const visitId = this.route.snapshot.paramMap.get('visitId');
    if (visitId) {
      this.vitalsService.getVitalsByVisit(visitId).subscribe({
        next: (response) => {
          this.vitals = response.data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading vitals:', error);
          this.vitals = null;
          this.isLoading = false;
        }
      });
    }
  }

  // Classification methods
  getBMIClass(bmi: number): string {
    if (bmi < 18.5) return 'warning';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'warning';
    return 'danger';
  }

  getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  getBPClass(bp: any): string {
    if (!bp?.systolic || !bp?.diastolic) return '';
    
    const systolic = bp.systolic;
    const diastolic = bp.diastolic;
    
    if (systolic >= 180 || diastolic >= 120) return 'critical';
    if (systolic >= 140 || diastolic >= 90) return 'danger';
    if (systolic >= 120 || diastolic >= 80) return 'warning';
    return 'normal';
  }

  getBPStatus(bp: any): string {
    if (!bp?.systolic || !bp?.diastolic) return '';
    
    const systolic = bp.systolic;
    const diastolic = bp.diastolic;
    
    if (systolic >= 180 || diastolic >= 120) return 'Hypertensive Crisis';
    if (systolic >= 140 || diastolic >= 90) return 'High';
    if (systolic >= 120 || diastolic >= 80) return 'Elevated';
    return 'Normal';
  }

  getPulseClass(pulse: number): string {
    if (pulse < 60) return 'warning';
    if (pulse <= 100) return 'normal';
    if (pulse <= 120) return 'warning';
    return 'danger';
  }

  getTemperatureClass(temp: number): string {
    if (temp < 36.1) return 'warning';
    if (temp <= 37.2) return 'normal';
    if (temp <= 38.3) return 'warning';
    return 'danger';
  }

  getSpO2Class(spo2: number): string {
    if (spo2 >= 95) return 'normal';
    if (spo2 >= 90) return 'warning';
    return 'danger';
  }

  getBloodSugarClass(bs: number): string {
    if (bs < 70) return 'danger';
    if (bs <= 140) return 'normal';
    if (bs <= 180) return 'warning';
    return 'danger';
  }

  editVitals(): void {
    const visitId = this.route.snapshot.paramMap.get('visitId');
    this.router.navigate(['/nurse/vitals', visitId]);
  }

  printVitals(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/nurse/dashboard']);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}