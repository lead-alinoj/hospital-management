import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from '../../../service/payment.service';
@Component({
  selector: 'app-add-payment-dialog',
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
    <h2 mat-dialog-title>Add Payment</h2>
    
    <mat-dialog-content>
      <div class="payment-info">
        <div class="info-item">
          <span>Total Bill:</span>
          <span>₹{{ data.totalBill | number:'1.2-2' }}</span>
        </div>
        <div class="info-item">
          <span>Already Paid:</span>
          <span>₹{{ data.currentPaid | number:'1.2-2' }}</span>
        </div>
        <div class="info-item">
          <span>Pending Balance:</span>
          <span class="balance">₹{{ data.maxAmount | number:'1.2-2' }}</span>
        </div>
      </div>
      
      <form [formGroup]="paymentForm" class="payment-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Amount (₹)</mat-label>
          <input matInput 
                 type="number" 
                 formControlName="amount"
                 [max]="data.maxAmount"
                 min="0" 
                 step="0.01">
          <mat-error *ngIf="paymentForm.get('amount')?.hasError('required')">
            Amount is required
          </mat-error>
          <mat-error *ngIf="paymentForm.get('amount')?.hasError('max')">
            Amount cannot exceed pending balance
          </mat-error>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Payment Mode</mat-label>
          <mat-select formControlName="paymentMode">
            <mat-option value="CASH">
              <mat-icon>payments</mat-icon> Cash
            </mat-option>
            <mat-option value="UPI">
              <mat-icon>qr_code</mat-icon> UPI
            </mat-option>
            <mat-option value="CARD">
              <mat-icon>credit_card</mat-icon> Card
            </mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Remarks (Optional)</mat-label>
          <textarea matInput 
                    formControlName="remarks" 
                    rows="2"
                    placeholder="Payment reference, notes..."></textarea>
        </mat-form-field>
        
        <div class="payment-preview" *ngIf="paymentForm.get('amount')?.value">
          <div class="preview-item">
            <span>New Paid:</span>
            <span>₹{{ (data.currentPaid + (paymentForm.get('amount')?.value || 0)) | number:'1.2-2' }}</span>
          </div>
          <div class="preview-item">
            <span>New Balance:</span>
            <span>₹{{ (data.maxAmount - (paymentForm.get('amount')?.value || 0)) | number:'1.2-2' }}</span>
          </div>
        </div>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button 
              color="primary" 
              [disabled]="!paymentForm.valid || paymentForm.get('amount')?.value <= 0"
              (click)="onSubmit()">
        Record Payment
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .payment-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .info-item:last-child {
      margin-bottom: 0;
      font-weight: 500;
    }
    
    .balance {
      color: #f44336;
      font-weight: bold;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .payment-preview {
      background: #e8f5e9;
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
    }
    
    .preview-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 14px;
    }
    
    .preview-item:last-child {
      margin-bottom: 0;
    }
  `]
})
export class AddPaymentDialogComponent {
  private fb = inject(FormBuilder);
  private paymentService = inject(PaymentService);
  private snackBar = inject(MatSnackBar);
  
  paymentForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AddPaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.paymentForm = this.fb.group({
      amount: [null, [
        Validators.required, 
        Validators.min(0),
        Validators.max(data.maxAmount)
      ]],
      paymentMode: ['CASH', Validators.required],
      remarks: ['']
    });
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      const paymentData = {
        visitId: this.data.visitId,
        patientId: this.data.patientId,
        amount: this.paymentForm.value.amount,
        paymentMode: this.paymentForm.value.paymentMode,
        remarks: this.paymentForm.value.remarks
      };

      this.paymentService.createPayment(paymentData).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Payment recorded successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.dialogRef.close({ success: true });
          }
        },
        error: (error) => {
          console.error('Error recording payment:', error);
          this.snackBar.open('Failed to record payment', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}