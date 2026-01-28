import { Component, OnInit } from '@angular/core';
import { Appointment, AppointmentService } from '../../service/appointment.service';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule
  ],
  template: `
    <div class="page-container">
      <div class="header">
        <h2>Appointments</h2>
        <span class="subtitle">All booked patient appointments</span>
      </div>

      <div class="table-card mat-elevation-z4">
        <table mat-table [dataSource]="appointments">

          <!-- Patient -->
          <ng-container matColumnDef="patientName">
            <th mat-header-cell *matHeaderCellDef>Patient</th>
            <td mat-cell *matCellDef="let appt">
              <div class="primary-text">{{ appt.patientName }}</div>
            </td>
          </ng-container>

          <!-- Contact -->
          <ng-container matColumnDef="contactNumber">
            <th mat-header-cell *matHeaderCellDef>Contact</th>
            <td mat-cell *matCellDef="let appt">{{ appt.contactNumber }}</td>
          </ng-container>

          <!-- Email -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let appt">{{ appt.email || '-' }}</td>
          </ng-container>

          <!-- Reason -->
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Reason</th>
            <td mat-cell *matCellDef="let appt" class="muted">
              {{ appt.description }}
            </td>
          </ng-container>

          <!-- Date -->
          <ng-container matColumnDef="appointmentDate">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let appt">
              {{ appt.appointmentDate | date:'dd MMM yyyy' }}
            </td>
          </ng-container>

          <!-- Time -->
          <ng-container matColumnDef="appointmentTime">
            <th mat-header-cell *matHeaderCellDef>Time</th>
            <td mat-cell *matCellDef="let appt">
              <span class="time-chip" [class.empty]="!appt.appointmentTime">
                {{ appt.appointmentTime || 'Not specified' }}
              </span>
            </td>
          </ng-container>

          <!-- Booked -->
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Booked</th>
            <td mat-cell *matCellDef="let appt">
              {{ appt.createdAt | date:'dd MMM, hh:mm a' }}
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns" sticky></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>

        <div *ngIf="appointments.length === 0" class="empty-state">
          No appointments found
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 100px;
      background: #f8fafc;
      min-height: 100vh;
    }

    .header {
      margin-bottom: 16px;
            font-weight: 25px;
                  color: #030c20;


    }

    .header h2 {
      margin: 0;
      font-weight: 30px;
      color: #0f172a;
    }

    .subtitle {
      font-size: 15px;
      color: #1a52a0;
    }

    .table-card {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #334155;
      font-size: 18px;
    }

    td {
      font-size: 14px;
      color: #1e293b;
    }

    tr.mat-row:hover {
      background: #f8fafc;
    }

    .primary-text {
      font-weight: 500;
    }

    .muted {
      color: #64748b;
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .time-chip {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 500;
    }

    .time-chip.empty {
      background: #f1f5f9;
      color: #64748b;
    }

    .empty-state {
      text-align: center;
      padding: 24px;
      color: #94a3b8;
      font-size: 14px;
    }
  `]
})
export class AdminAppointmentsComponent implements OnInit {

  appointments: Appointment[] = [];

  columns: string[] = [
    'patientName',
    'contactNumber',
    'email',
    'description',
    'appointmentDate',
    'appointmentTime',
    'createdAt'
  ];

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.appointmentService.getAppointments().subscribe({
      next: res => {
        this.appointments = res;
      },
      error: err => console.error(err)
    });
  }
}
