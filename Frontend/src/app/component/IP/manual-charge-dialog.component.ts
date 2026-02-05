import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-manual-charge-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
],
  template: `
    <h2 mat-dialog-title>Add Manual Charge</h2>
    <mat-dialog-content>
      <form [formGroup]="chargeForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" placeholder="Enter charge description">
        </mat-form-field>
        
<mat-form-field appearance="outline" class="full-width">
  <mat-label>Category</mat-label>
  <mat-select formControlName="category">
    <mat-option value="ROOM">
      <mat-icon>hotel</mat-icon> Room Charges
    </mat-option>
    <mat-option value="DOCTOR">
      <mat-icon>medical_services</mat-icon> Doctor Consultation
    </mat-option>
    <mat-option value="NURSING">
      <mat-icon>healing</mat-icon> Nursing Care
    </mat-option>
    <mat-option value="MEDICINE">
      <mat-icon>medication</mat-icon> Medicines
    </mat-option>
    <mat-option value="PROCEDURE">
      <mat-icon>medical_services</mat-icon> Procedure
    </mat-option>
    <mat-option value="LAB">
      <mat-icon>science</mat-icon> Lab Test
    </mat-option>
    <mat-option value="CONSULTATION">
      <mat-icon>groups</mat-icon> Specialist Consultation
    </mat-option>
    <mat-option value="OTHER">
      <mat-icon>receipt</mat-icon> Other
    </mat-option>
  </mat-select>
</mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Amount (₹)</mat-label>
          <input matInput type="number" formControlName="amount" min="0" step="0.01">
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="!chargeForm.valid"
              (click)="onSubmit()">Add Charge</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 15px; }`]
})
export class ManualChargeDialogComponent {
  private fb = inject(FormBuilder);
  chargeForm: FormGroup;

// In the constructor, update form initialization:
constructor(
  public dialogRef: MatDialogRef<ManualChargeDialogComponent>,
  @Inject(MAT_DIALOG_DATA) public data: any
) {
  // Use service categories only
  const categoryOptions = [
    'ROOM', 'DOCTOR', 'NURSING', 'PROCEDURE', 'LAB', 'OTHER'
  ];
  
  // Pre-fill if provided
  if (data.prefill) {
    this.chargeForm = this.fb.group({
      description: [data.prefill.description || '', Validators.required],
      category: [data.prefill.category || 'OTHER', Validators.required],
      amount: [data.prefill.amount || 0, [Validators.required, Validators.min(0)]],
      quantity: [data.prefill.quantity || 1, [Validators.required, Validators.min(1)]],
      unitPrice: [data.prefill.unitPrice || 0],
      notes: [data.prefill.notes || '']
    });
  } else {
    this.chargeForm = this.fb.group({
      description: ['', Validators.required],
      category: ['OTHER', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0],
      notes: ['']
    });
  }
  
  // Auto-calculate unit price when amount or quantity changes
  this.chargeForm.get('amount')?.valueChanges.subscribe(() => this.calculateUnitPrice());
  this.chargeForm.get('quantity')?.valueChanges.subscribe(() => this.calculateUnitPrice());
}
private calculateUnitPrice(): void {
  const amount = this.chargeForm.get('amount')?.value || 0;
  const quantity = this.chargeForm.get('quantity')?.value || 1;
  const unitPrice = quantity > 0 ? amount / quantity : 0;
  this.chargeForm.patchValue({ unitPrice: parseFloat(unitPrice.toFixed(2)) }, { emitEvent: false });
}
onSubmit(): void {
  if (this.chargeForm.valid) {
    const formValue = this.chargeForm.value;
    
    // Calculate unit price
    const quantity = formValue.quantity || 1;
    const unitPrice = formValue.unitPrice || (formValue.amount / quantity);
    
    this.dialogRef.close({
      success: true,
      data: {
        description: formValue.description,
        category: formValue.category,
        amount: formValue.amount,
        quantity: quantity,
        unitPrice: unitPrice,
        notes: formValue.notes || '',
        user: this.data.user,
        patientId: this.data.patient?._id,
        visitId: this.data.visitId
      }
    });
  } else {
    // Show validation errors
    Object.keys(this.chargeForm.controls).forEach(key => {
      const control = this.chargeForm.get(key);
      if (control?.invalid) {
        console.error(`${key} is invalid:`, control.errors);
      }
    });
  }
}

  onCancel(): void {
    this.dialogRef.close();
  }
}