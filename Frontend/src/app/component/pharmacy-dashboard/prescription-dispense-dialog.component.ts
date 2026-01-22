// prescription-dispense-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-prescription-dispense-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Dispense Prescription</h2>
    
    <mat-dialog-content>
      <div class="prescription-summary">
        <h4>Prescription Summary</h4>
        <p><strong>Patient:</strong> {{ data.prescription.patientId?.fullName }}</p>
        <p><strong>Total Amount:</strong> ₹{{ data.totalAmount | number:'1.2-2' }}</p>
        <p><strong>Medicines:</strong> {{ data.prescription.medicines.length }} items</p>
      </div>

      <form [formGroup]="dispenseForm">
       

        <mat-form-field appearance="outline" class="full-width">
  <mat-label>Lab Charges</mat-label>
  <input matInput type="number" formControlName="labCharges">
</mat-form-field>

<mat-form-field appearance="outline" class="full-width">
  <mat-label>Consultation Fee</mat-label>
  <input matInput type="number" formControlName="consultationFee">
</mat-form-field>

<mat-form-field appearance="outline" class="full-width">
  <mat-label>Other Charges</mat-label>
  <input matInput type="number" formControlName="otherCharges">
</mat-form-field>

<!-- TOTAL PAYABLE -->
<div class="total-box">
  <div class="row">
    <span>Medicine Amount</span>
    <strong>₹{{ data.totalAmount }}</strong>
  </div>

  <div class="row">
    <span>Extra Charges</span>
    <strong>₹{{ extraCharges }}</strong>
  </div>

  <div class="row total">
    <span>Total Payable</span>
    <strong>₹{{ totalPayable }}</strong>
  </div>
</div>

   <mat-form-field appearance="outline" class="full-width" *ngIf="totalPayable > 0">
  <mat-label>Payment Method</mat-label>
  <mat-select formControlName="paymentMethod">
    <mat-option value="Cash">Cash</mat-option>
    <mat-option value="Card">Card</mat-option>
    <mat-option value="UPI">UPI</mat-option>
    <mat-option value="Insurance">Insurance</mat-option>
  </mat-select>
</mat-form-field>


        <mat-form-field appearance="outline" class="full-width" *ngIf="dispenseForm.get('paymentMethod')?.value === 'Insurance'">
          <mat-label>Insurance ID</mat-label>
          <input matInput formControlName="insuranceId">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
  [disabled]="!dispenseForm.valid || totalPayable <= 0"
        (click)="onDispense()">
        Complete Dispensing
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
  .total-box {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin: 15px 0;
}

.total-box .row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.total-box .total {
  border-top: 1px dashed #ccc;
  padding-top: 6px;
  font-size: 16px;
}

    .prescription-summary {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .full-width { width: 100%; margin-bottom: 15px; }
  `]
})
export class PrescriptionDispenseDialog {
  dispenseForm: FormGroup;

   totalPayable = 0;
  extraCharges = 0;

constructor(
  private fb: FormBuilder,
  public dialogRef: MatDialogRef<PrescriptionDispenseDialog>,
  @Inject(MAT_DIALOG_DATA) public data: any
) {
  this.dispenseForm = this.fb.group({
    paymentMethod: ['', Validators.required],
    insuranceId: [''],
    notes: [''],
    labCharges: [0, [Validators.min(0)]],
    consultationFee: [0, [Validators.min(0)]],
    otherCharges: [0, [Validators.min(0)]]
  });

  // INITIAL CALCULATION
  this.calculateTotal();

  // 🔥 REAL-TIME CALCULATION
  this.dispenseForm.valueChanges.subscribe(() => {
    this.calculateTotal();
  });
}

calculateTotal(): void {
  const lab = +this.dispenseForm.value.labCharges || 0;
  const consult = +this.dispenseForm.value.consultationFee || 0;
  const other = +this.dispenseForm.value.otherCharges || 0;

  this.extraCharges = lab + consult + other;
  this.totalPayable = this.data.totalAmount + this.extraCharges;
}

  onCancel(): void {
    this.dialogRef.close();
  }

  onDispense(): void {
    if (this.totalPayable <= 0 || !this.dispenseForm.valid) return;

    this.dialogRef.close({
      ...this.dispenseForm.value,
      paymentAmount: this.totalPayable
    });
  }
}