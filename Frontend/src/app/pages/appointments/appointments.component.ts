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
    <h2>All Appointments</h2>
    <table mat-table [dataSource]="appointments" class="mat-elevation-z8">

      <ng-container matColumnDef="patientName">
        <th mat-header-cell *matHeaderCellDef>Patient Name</th>
        <td mat-cell *matCellDef="let appt">{{ appt.patientName }}</td>
      </ng-container>

      <ng-container matColumnDef="contactNumber">
        <th mat-header-cell *matHeaderCellDef>Contact</th>
        <td mat-cell *matCellDef="let appt">{{ appt.contactNumber }}</td>
      </ng-container>

      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let appt">{{ appt.email }}</td>
      </ng-container>

      <ng-container matColumnDef="description">
        <th mat-header-cell *matHeaderCellDef>Description</th>
        <td mat-cell *matCellDef="let appt">{{ appt.description }}</td>
      </ng-container>

      <ng-container matColumnDef="appointmentDate">
        <th mat-header-cell *matHeaderCellDef>Appointment Date</th>
        <td mat-cell *matCellDef="let appt">{{ appt.appointmentDate | date:'shortDate' }}</td>
      </ng-container>

      <ng-container matColumnDef="appointmentTime">
        <th mat-header-cell *matHeaderCellDef>Appointment Time</th>
        <td mat-cell *matCellDef="let appt">{{ appt.appointmentTime }}</td>
      </ng-container>

      <ng-container matColumnDef="createdAt">
        <th mat-header-cell *matHeaderCellDef>Booked At</th>
        <td mat-cell *matCellDef="let appt">{{ appt.createdAt | date:'short' }}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns;"></tr>
    </table>
  `,
  styles: [`
    table { width: 100%; margin-top: 20px; }
  `]
})
export class AdminAppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  columns: string[] = ['patientName','contactNumber','email','description','appointmentDate','appointmentTime','createdAt'];

  constructor(private appointmentService: AppointmentService) {}

ngOnInit() {
  this.appointmentService.getAppointments().subscribe({
    next: res => {
      console.log('Appointments:', res);
      // Check the first appointment
      if (res.length > 0) {
        console.log('First appointment:', res[0]);
        console.log('Date field exists?', 'appointmentDate' in res[0]);
        console.log('Date value:', res[0].appointmentDate);
      }
      this.appointments = res;
    },
    error: err => console.error(err)
  });
}

}
