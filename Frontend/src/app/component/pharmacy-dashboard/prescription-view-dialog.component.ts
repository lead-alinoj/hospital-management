import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Prescription Details</h2>

    <mat-dialog-content>
      <p><b>Patient:</b> {{ data.patientId?.fullName }}</p>
      <p><b>Visit Date:</b> {{ data.visitId?.visitDate | date:'mediumDate' }}</p>

      <p><b>Doctor:</b> Dr. {{ data.doctorId?.name }}</p>
      <p><b>Diagnosis:</b> {{ data.diagnosis }}</p>

      <h4>Medicines</h4>
      <ul>
<li *ngFor="let m of data.medicines">
  {{ m.medicineName }}
  — {{ m.quantity }} ×
  ₹{{ m.isOutOfStock ? 0 : m.unitPrice }}

  <span *ngIf="m.isOutOfStock" style="color:red">
    (Out of stock)
  </span>
</li>


      </ul>

      <p><b>Total:</b> ₹{{ data.totalAmount }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close>
        Close
      </button>
    </mat-dialog-actions>
  `
})
export class PrescriptionViewDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
