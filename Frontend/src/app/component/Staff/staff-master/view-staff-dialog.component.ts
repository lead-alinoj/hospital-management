import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-staff-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>person</mat-icon>
      Staff Details
    </h2>

    <div mat-dialog-content class="dialog-content">

      <div class="detail-row">
        <span class="label">Name</span>
        <span class="value">{{ data.name }}</span>
      </div>

      <div class="detail-row">
        <span class="label">System Role</span>
        <span class="value">{{ data.systemRole || 'None' }}</span>
      </div>

      <div class="detail-row">
        <span class="label">Job Role</span>
        <span class="value">{{ data.jobRole }}</span>
      </div>

      <div class="detail-row">
        <span class="label">Phone</span>
        <span class="value">{{ data.phone }}</span>
      </div>

      <div class="detail-row">
        <span class="label">Gender</span>
        <span class="value">{{ data.gender || '-' }}</span>
      </div>

      <div class="detail-row">
        <span class="label">Qualification</span>
        <span class="value">{{ data.qualification || '-' }}</span>
      </div>

      <div class="detail-row">
        <span class="label">Salary</span>
        <span class="value">₹ {{ data.salary }}</span>
      </div>

      <div class="detail-row">
        <span class="label">Status</span>
        <span class="value status"
              [class.active]="data.status === 'Active'"
              [class.inactive]="data.status === 'Inactive'">
          {{ data.status }}
        </span>
      </div>

    </div>

    <div mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close>
        Close
      </button>
    </div>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      color: #2d3748;

      mat-icon {
        color: #667eea;
      }
    }

    .dialog-content {
      padding-top: 10px;
      min-width: 350px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px dashed #e2e8f0;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-weight: 500;
        color: #4a5568;
      }

      .value {
        font-weight: 600;
        color: #1a202c;
      }

      .status {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        text-transform: uppercase;

        &.active {
          background: #48bb78;
          color: #fff;
        }

        &.inactive {
          background: #f56565;
          color: #fff;
        }
      }
    }

    @media (max-width: 480px) {
      .dialog-content {
        min-width: 100%;
      }

      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  `]
})
export class ViewStaffDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
