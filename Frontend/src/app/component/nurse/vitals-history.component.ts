import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { VitalsService } from '../../service/vitals.service';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-vitals-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatProgressSpinnerModule
],
  template: `
    <div class="vitals-history-container">
      <mat-card>
  <mat-card-header>
    <mat-card-title>
      <mat-icon>history</mat-icon>
      Vitals History
    </mat-card-title>

    <mat-card-subtitle>
      Patient: {{ patientName }}
    </mat-card-subtitle>

    <mat-card-subtitle>
      Showing all vitals history (all visits)
    </mat-card-subtitle>

  </mat-card-header>

        <mat-card-content>
          <div class="table-container" *ngIf="vitalsHistory.length > 0">
            <table mat-table [dataSource]="vitalsHistory" class="mat-elevation-z2">
              
              <!-- Date Column -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let item">
                  {{ item.recordedAt | date:'medium' }}
                </td>
              </ng-container>

              <!-- BP Column -->
              <ng-container matColumnDef="bp">
                <th mat-header-cell *matHeaderCellDef>Blood Pressure</th>
                <td mat-cell *matCellDef="let item">
                  <div [ngClass]="{'abnormal': isBPAbnormal(item.bloodPressure)}">
                    {{ item.bloodPressure?.systolic || '--' }}/{{ item.bloodPressure?.diastolic || '--' }}
                  </div>
                </td>
              </ng-container>

              <!-- Temp Column -->
              <ng-container matColumnDef="temp">
                <th mat-header-cell *matHeaderCellDef>Temp (°C)</th>
                <td mat-cell *matCellDef="let item">
                  <div [ngClass]="{'abnormal': isTempAbnormal(item.temperature)}">
                    {{ item.temperature?.value || '--' }}
                  </div>
                </td>
              </ng-container>

              <!-- Pulse Column -->
              <ng-container matColumnDef="pulse">
                <th mat-header-cell *matHeaderCellDef>Pulse</th>
                <td mat-cell *matCellDef="let item">
                  {{ item.pulse?.value || '--' }}
                </td>
              </ng-container>

              <!-- SpO2 Column -->
              <ng-container matColumnDef="spo2">
                <th mat-header-cell *matHeaderCellDef>SpO₂</th>
                <td mat-cell *matCellDef="let item">
                  <div [ngClass]="{'abnormal': isSpO2Abnormal(item.spo2)}">
                    {{ item.spo2?.value || '--' }}%
                  </div>
                </td>
              </ng-container>

              <!-- BMI Column -->
              <ng-container matColumnDef="bmi">
                <th mat-header-cell *matHeaderCellDef>BMI</th>
                <td mat-cell *matCellDef="let item">
                  <div [ngClass]="getBMIClass(item.bmi)">
                    {{ item.bmi | number:'1.1-1' }}
                  </div>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let item">
                  <button mat-icon-button color="primary" (click)="viewDetails(item)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <mat-paginator [length]="totalItems"
                          [pageSize]="pageSize"
                          [pageSizeOptions]="[5, 10, 25]"
                          (page)="onPageChange($event)">
            </mat-paginator>
          </div>

          <div *ngIf="vitalsHistory.length === 0 && !isLoading" class="no-data">
            <mat-icon>info</mat-icon>
            <h3>No Vitals History</h3>
            <p>No previous vitals records found for this patient.</p>
          </div>

          <div *ngIf="isLoading" class="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading vitals history...</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .vitals-history-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
    }

    .abnormal {
      color: #f44336;
      font-weight: bold;
    }

    .normal { color: #4caf50; }
    .warning { color: #ff9800; }
    .danger { color: #f44336; }

    .no-data, .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .no-data mat-icon, .loading mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .vitals-history-container {
        padding: 10px;
      }
      
      table {
        font-size: 12px;
      }
    }
  `]
})
export class VitalsHistoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private vitalsService = inject(VitalsService);

  patientName = '';
  vitalsHistory: any[] = [];
  displayedColumns = ['date', 'bp', 'temp', 'pulse', 'spo2', 'bmi', 'actions'];
  totalItems = 0;
  pageSize = 10;
  currentPage = 1;
  isLoading = false;

  ngOnInit(): void {
    this.loadVitalsHistory();
  }

loadVitalsHistory(): void {
  const patientId = this.route.snapshot.paramMap.get('patientId');

  if (!patientId) return;

  this.isLoading = true;

  this.vitalsService
    .getPatientVitalsHistory(patientId, this.currentPage, this.pageSize)
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.vitalsHistory = response.data; // ALL HISTORY
          this.totalItems = response.pagination?.total || response.data.length;
          this.patientName =
            response.data[0]?.patient?.fullName || 'Patient';
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
}


  isBPAbnormal(bp: any): boolean {
    return bp?.systolic > 140 || bp?.diastolic > 90;
  }

  isTempAbnormal(temp: any): boolean {
    return temp?.value > 37.5;
  }

  isSpO2Abnormal(spo2: any): boolean {
    return spo2?.value < 95;
  }

  getBMIClass(bmi: number): string {
    if (!bmi) return '';
    if (bmi < 18.5) return 'warning';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'warning';
    return 'danger';
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadVitalsHistory();
  }

  viewDetails(vitals: any): void {
    // Navigate to vitals view page
    console.log('View vitals details:', vitals);
  }
}