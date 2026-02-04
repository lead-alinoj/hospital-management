import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-edit-bill-item-dialog',
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
    <h2 mat-dialog-title>Edit Bill Item</h2>
    
    <mat-dialog-content>
      <form [formGroup]="editForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Item Name</mat-label>
          <input matInput formControlName="name">
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category</mat-label>
          <mat-select formControlName="categoryType">
            <mat-option value="Medicine">Medicine</mat-option>
            <mat-option value="Consumable">Consumable</mat-option>
            <mat-option value="Procedure">Procedure</mat-option>
            <mat-option value="Consultation">Consultation</mat-option>
            <mat-option value="Lab">Lab Test</mat-option>
            <mat-option value="Other">Other</mat-option>
          </mat-select>
        </mat-form-field>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Quantity</mat-label>
            <input matInput type="number" formControlName="quantity" min="1">
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Unit Price (₹)</mat-label>
            <input matInput type="number" formControlName="unitPrice" min="0" step="0.01">
          </mat-form-field>
        </div>
        
        <div class="form-row" *ngIf="editForm.get('categoryType')?.value === 'Medicine'">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Days</mat-label>
            <input matInput type="number" formControlName="days" min="1">
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Frequency</mat-label>
            <mat-select formControlName="frequency">
              <mat-option value="OD">Once Daily</mat-option>
              <mat-option value="BD">Twice Daily</mat-option>
              <mat-option value="TDS">Thrice Daily</mat-option>
              <mat-option value="QID">Four Times</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Instructions / Notes</mat-label>
          <textarea matInput formControlName="instructions" rows="3"></textarea>
        </mat-form-field>
        
        <div class="total-info">
          <strong>Total: ₹{{ calculateTotal() | number:'1.2-2' }}</strong>
        </div>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="!editForm.valid"
              (click)="onSave()">
        Save Changes
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 15px; }
    .half-width { width: 48%; }
    .form-row { display: flex; justify-content: space-between; gap: 15px; }
    .total-info { 
      padding: 10px; 
      background: #e3f2fd; 
      border-radius: 4px;
      text-align: center;
      margin-top: 10px;
    }
  `]
})
export class EditBillItemDialogComponent {
  private fb = inject(FormBuilder);
  editForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditBillItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.editForm = this.fb.group({
      name: [data.item.name, Validators.required],
      categoryType: [data.item.categoryType || 'Other', Validators.required],
      quantity: [data.item.quantity, [Validators.required, Validators.min(1)]],
      unitPrice: [data.item.unitPrice, [Validators.required, Validators.min(0)]],
      days: [data.item.days || 1, [Validators.min(1)]],
      frequency: [data.item.frequency || 'BD'],
      instructions: [data.item.instructions || '']
    });
  }

  calculateTotal(): number {
    const quantity = this.editForm.get('quantity')?.value || 0;
    const unitPrice = this.editForm.get('unitPrice')?.value || 0;
    const days = this.editForm.get('days')?.value || 1;
    
    if (this.editForm.get('categoryType')?.value === 'Medicine') {
      return quantity * unitPrice * days;
    }
    return quantity * unitPrice;
  }

  onSave(): void {
    if (this.editForm.valid) {
      this.dialogRef.close({
        success: true,
        data: {
          ...this.editForm.value,
          totalPrice: this.calculateTotal(),
          updatedBy: this.data.user
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}