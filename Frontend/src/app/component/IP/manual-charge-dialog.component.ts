import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

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
    MatButtonModule
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
            <mat-option value="CONSULTATION">Consultation</mat-option>
            <mat-option value="PROCEDURE">Procedure</mat-option>
            <mat-option value="LAB">Lab Test</mat-option>
            <mat-option value="NURSING">Nursing Care</mat-option>
            <mat-option value="OTHER">Other</mat-option>
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

  constructor(
    public dialogRef: MatDialogRef<ManualChargeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.chargeForm = this.fb.group({
      description: ['', Validators.required],
      category: ['OTHER', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  onSubmit(): void {
    if (this.chargeForm.valid) {
      this.dialogRef.close({
        success: true,
        data: {
          ...this.chargeForm.value,
          user: this.data.user
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}