import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-final-bill-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title>Generate Final Bill</h2>
    
    <mat-dialog-content>
      <!-- Patient Info -->
      <div class="patient-info">
        <h3>{{ data.patient.patient?.fullName }}</h3>
        <p>OP: {{ data.patient.patient?.opNumber }} | Room: {{ data.patient.bedAllocated?.room?.roomNumber }}</p>
        <p>Admission Date: {{ data.patient.admissionDate | date:'medium' }}</p>
        <p>Stay Duration: {{ data.stayDays }} days</p>
      </div>
      
      <!-- Bill Summary -->
      <div class="bill-summary">
        <h4>Bill Summary</h4>
        
        <div class="summary-section">
          <div class="summary-item">
            <span>Room Charges ({{ data.stayDays }} days):</span>
            <span>₹{{ data.roomCharges | number:'1.2-2' }}</span>
          </div>
          <div class="summary-item">
            <span>Doctor Consultation:</span>
            <span>₹{{ data.doctorFees | number:'1.2-2' }}</span>
          </div>
          <div class="summary-item">
            <span>Nursing Charges:</span>
            <span>₹{{ data.nursingCharges | number:'1.2-2' }}</span>
          </div>
          
          <mat-divider></mat-divider>
          
          <!-- Itemized Charges -->
          <div *ngFor="let item of data.billItems" class="bill-item">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-details">
              <span>{{ item.quantity }} × ₹{{ item.unitPrice | number:'1.2-2' }}</span>
              <strong>₹{{ item.totalPrice | number:'1.2-2' }}</strong>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <div class="summary-item">
            <span>Subtotal:</span>
            <span>₹{{ data.subtotal | number:'1.2-2' }}</span>
          </div>
          <div class="summary-item">
            <span>Tax (GST 18%):</span>
            <span>₹{{ data.tax | number:'1.2-2' }}</span>
          </div>
          <div class="summary-item grand-total">
            <strong>Grand Total:</strong>
            <strong>₹{{ data.total | number:'1.2-2' }}</strong>
          </div>
        </div>
      </div>
      
      <!-- Payment Form -->
      <form [formGroup]="paymentForm" class="payment-form">
        <h4>Payment Details</h4>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Total Amount</mat-label>
          <input matInput [value]="data.total" readonly>
          <span matTextPrefix>₹</span>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Amount Paid</mat-label>
          <input matInput type="number" formControlName="paymentAmount" 
                 [max]="data.total" min="0" step="0.01">
          <span matTextPrefix>₹</span>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Payment Method</mat-label>
          <mat-select formControlName="paymentMethod">
            <mat-option value="Cash">Cash</mat-option>
            <mat-option value="Card">Card</mat-option>
            <mat-option value="UPI">UPI</mat-option>
            <mat-option value="Insurance">Insurance</mat-option>
            <mat-option value="Other">Other</mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width" *ngIf="paymentForm.get('paymentMethod')?.value === 'Insurance'">
          <mat-label>Insurance ID</mat-label>
          <input matInput formControlName="insuranceId">
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
        
        <div class="balance-info" *ngIf="paymentForm.get('paymentAmount')?.value < data.total">
          <mat-icon color="warn">warning</mat-icon>
          <span>Balance: ₹{{ data.total - (paymentForm.get('paymentAmount')?.value || 0) | number:'1.2-2' }}</span>
        </div>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="!paymentForm.valid"
              (click)="onSubmit()">
        Generate Bill & Mark as Billed
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .patient-info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .bill-summary {
      margin-bottom: 20px;
    }
    
    .summary-section {
      padding: 15px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    
    .summary-item:last-child {
      border-bottom: none;
    }
    
    .grand-total {
      font-size: 1.2em;
      color: #1976d2;
      font-weight: bold;
    }
    
    .bill-item {
      margin: 10px 0;
      padding: 8px;
      background: white;
      border-radius: 4px;
    }
    
    .item-name {
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .item-details {
      display: flex;
      justify-content: space-between;
      color: #666;
    }
    
    .payment-form {
      margin-top: 20px;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    
    .balance-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #fff3e0;
      border-radius: 4px;
      color: #f57c00;
      font-weight: 500;
    }
  `]
})
export class FinalBillDialogComponent {
  private fb = inject(FormBuilder);
  paymentForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<FinalBillDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.paymentForm = this.fb.group({
      paymentAmount: [data.total, [Validators.required, Validators.min(0)]],
      paymentMethod: ['Cash', Validators.required],
      insuranceId: [''],
      notes: ['']
    });
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      this.dialogRef.close({
        success: true,
        paymentData: {
          ...this.paymentForm.value,
          totalAmount: this.data.total,
          billingDate: new Date()
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}