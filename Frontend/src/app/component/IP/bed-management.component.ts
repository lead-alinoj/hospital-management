import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BedService } from '../../service/bed.service';
import { Bed } from '../../models/bed.model';

@Component({
  selector: 'app-bed-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
  <mat-card class="page-card">
    <h2>Bed Management</h2>

    <table mat-table [dataSource]="beds" class="mat-elevation-z2">
<ng-container matColumnDef="careUnit">
  <th mat-header-cell *matHeaderCellDef>Care Unit</th>
  <td mat-cell *matCellDef="let b">
    {{ b.careUnit?.unitNumber }}
  </td>
</ng-container>

      <ng-container matColumnDef="bedNumber">
        <th mat-header-cell *matHeaderCellDef>Bed</th>
        <td mat-cell *matCellDef="let b">{{ b.bedNumber }}</td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let b">
          <span [style.color]="color(b.status)">{{ b.status }}</span>
        </td>
      </ng-container>

      <ng-container matColumnDef="patient">
        <th mat-header-cell *matHeaderCellDef>Patient</th>
        <td mat-cell *matCellDef="let b">
          {{ b.currentPatient?.fullName || '-' }}
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let b">

          <button mat-icon-button color="primary"
            *ngIf="b.status === 'AVAILABLE'"
            (click)="setStatus(b,'MAINTENANCE')">
            <mat-icon>build</mat-icon>
          </button>

          <button mat-icon-button color="accent"
            *ngIf="b.status === 'MAINTENANCE'"
            (click)="setStatus(b,'AVAILABLE')">
            <mat-icon>check_circle</mat-icon>
          </button>

          <button mat-icon-button color="warn"
            *ngIf="b.status === 'OCCUPIED'"
            (click)="discharge(b)">
            <mat-icon>logout</mat-icon>
          </button>

        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
  </mat-card>
  `,
  styles: [`
    .page-card { padding: 20px; }
    table { width: 100%; }
  `]
})
export class BedManagementComponent implements OnInit {

  private bedService = inject(BedService);
  private snack = inject(MatSnackBar);

  beds: Bed[] = [];
cols = ['bedNumber', 'careUnit', 'status', 'patient', 'actions'];

  ngOnInit() {
    this.load();
  }

  load() {
    this.bedService.getAllBeds().subscribe(res => this.beds = res.data as Bed[]);
  }

  discharge(bed: Bed) {
    this.bedService.dischargeBed(bed._id).subscribe(() => {
      this.snack.open('Patient discharged', 'Close', { duration: 3000 });
      this.load();
    });
  }

  setStatus(bed: Bed, status: any) {
    this.bedService.updateBed(bed._id, { status }).subscribe(() => {
      bed.status = status;
    });
  }

  color(status: string) {
    return {
      AVAILABLE: 'green',
      OCCUPIED: 'red',
      MAINTENANCE: 'orange',
      CLEANING: 'blue'
    }[status];
  }
}
