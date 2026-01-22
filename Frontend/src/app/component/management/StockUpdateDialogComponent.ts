import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-stock-update-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>
      Update Stock: {{ data.medicine.name }}
    </h2>
    
    <mat-dialog-content>
      <div class="current-stock-info">
        <p>Current Stock: <strong>{{ data.medicine.stockQty }}</strong></p>
        <p>Minimum Stock: <strong>{{ data.medicine.minStock }}</strong></p>
      </div>

      <form [formGroup]="data.stockForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Operation</mat-label>
          <mat-select formControlName="type">
            <mat-option value="add">Add Stock</mat-option>
            <mat-option value="subtract">Remove Stock</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Quantity *</mat-label>
          <input matInput formControlName="quantity" type="number" min="1">
          <mat-error *ngIf="data.stockForm.get('quantity')?.hasError('required')">
            Quantity is required
          </mat-error>
          <mat-error *ngIf="data.stockForm.get('quantity')?.hasError('min')">
            Quantity must be at least 1
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" 
          *ngIf="data.stockForm.get('type')?.value === 'add'">
          <mat-label>Reason</mat-label>
          <input matInput formControlName="reason" placeholder="e.g., New purchase, Return">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" 
        [disabled]="data.stockForm.invalid"
        (click)="dialogRef.close(true)">
        Update Stock
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .current-stock-info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .full-width { width: 100%; }
  `]
})
export class StockUpdateDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<StockUpdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}