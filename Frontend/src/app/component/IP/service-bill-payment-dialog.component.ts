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
  selector: 'app-service-bill-payment-dialog',
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
    <h2 mat-dialog-title>Service Bill Payment</h2>
    
    <mat-dialog-content>
      <!-- Patient Info -->
      <div class="patient-info">
        <h3>{{ data.patient.patient?.fullName }}</h3>
        <p>OP: {{ data.patient.patient?.opNumber }} | Room: {{ data.patient.bedAllocated?.room?.roomNumber }}</p>
      </div>
      
      <!-- Service Charges Summary -->
      <div class="bill-summary">
        <h4>Service Charges</h4>
        <div class="charges-list">
          <div *ngFor="let category of getGroupedCharges()" class="charge-category">
            <div class="category-header">{{ category.name }}</div>
            <div *ngFor="let item of category.items" class="charge-item">
              <span>{{ item.name }}</span>
              <span>₹{{ item.totalPrice | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
        
        <mat-divider></mat-divider>
        
        <div class="summary-item">
          <span>Service Total:</span>
          <span>₹{{ data.serviceTotal | number:'1.2-2' }}</span>
        </div>
        
        <!-- <div class="summary-item">
          <span>Tax (GST 18%):</span>
          <span>₹{{ calculateTax() | number:'1.2-2' }}</span>
        </div> -->
        
        <div class="summary-item grand-total">
          <strong>Amount Due:</strong>
          <strong>₹{{ data.serviceTotal | number:'1.2-2' }}</strong>
        </div>
      </div>
      
      <!-- Payment Form -->
      <form [formGroup]="paymentForm" class="payment-form">
        <h4>Payment Details</h4>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Amount Paid</mat-label>
          <input matInput type="number" formControlName="paymentAmount" 
                 [max]="data.serviceTotal" min="0" step="0.01">
          <span matTextPrefix>₹</span>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Payment Method</mat-label>
          <mat-select formControlName="paymentMethod">
            <mat-option value="Cash">Cash</mat-option>
            <mat-option value="Card">Card</mat-option>
            <mat-option value="UPI">UPI</mat-option>
            <mat-option value="Insurance">Insurance</mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width" *ngIf="paymentForm.get('paymentMethod')?.value === 'Insurance'">
          <mat-label>Insurance ID</mat-label>
          <input matInput formControlName="insuranceId">
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2" placeholder="Payment remarks..."></textarea>
        </mat-form-field>
        
        <!-- Balance Warning -->
        <div class="balance-warning" *ngIf="paymentForm.get('paymentAmount')?.value < data.serviceTotal">
          <mat-icon color="warn">warning</mat-icon>
          <span>Balance: ₹{{ calculateBalance() | number:'1.2-2' }}</span>
        </div>
        
        <!-- Payment Type -->
        <div class="payment-type">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Payment Type</mat-label>
            <mat-select formControlName="paymentType">
              <mat-option value="FULL">Full Payment</mat-option>
              <mat-option value="PARTIAL">Partial Payment</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="!paymentForm.valid"
              (click)="onSubmit()">
        Generate Service Bill
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .patient-info {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .bill-summary {
      margin-bottom: 20px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    
    .charges-list {
      max-height: 200px;
      overflow-y: auto;
      margin-bottom: 15px;
    }
    
    .charge-category {
      margin-bottom: 15px;
    }
    
    .category-header {
      font-weight: 500;
      color: #1976d2;
      padding: 5px 0;
      border-bottom: 1px solid #ddd;
      margin-bottom: 5px;
    }
    
    .charge-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 10px;
      font-size: 14px;
    }
    
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    
    .grand-total {
      font-size: 1.2em;
      color: #1976d2;
      font-weight: bold;
      border-top: 2px solid #ddd;
      margin-top: 10px;
      padding-top: 10px;
    }
    
    .payment-form {
      margin-top: 20px;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    
    .balance-warning {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #fff3e0;
      border-radius: 4px;
      color: #f57c00;
      font-weight: 500;
      margin-bottom: 15px;
    }
  `]
})
export class ServiceBillPaymentDialogComponent {
  private fb = inject(FormBuilder);
  paymentForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ServiceBillPaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.paymentForm = this.fb.group({
      paymentAmount: [data.serviceTotal, [Validators.required, Validators.min(0)]],
      paymentMethod: ['Cash', Validators.required],
      paymentType: ['FULL', Validators.required],
      insuranceId: [''],
      notes: ['']
    });
  }

  calculateTax(): number {
    // return this.data.serviceTotal * 0.18;
    return 0;
  }

  calculateBalance(): number {
    const paid = this.paymentForm.get('paymentAmount')?.value || 0;
    return this.data.serviceTotal - paid;
  }

  getGroupedCharges(): any[] {
    const items = this.data.serviceItems || [];
    const groups: any = {};
    
    items.forEach((item: any) => {
      const category = item.categoryType || 'OTHER';
      if (!groups[category]) {
        groups[category] = {
          name: this.getCategoryName(category),
          items: []
        };
      }
      groups[category].items.push(item);
    });
    
    return Object.values(groups);
  }

  getCategoryName(category: string): string {
    const names: {[key: string]: string} = {
      'ROOM': 'Room Charges',
      'NURSING': 'Nursing Care',
      'DOCTOR': 'Doctor Consultation',
      'PROCEDURE': 'Procedures',
      'LAB': 'Lab Tests',
      'OTHER': 'Other Charges'
    };
    return names[category] || category;
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      this.dialogRef.close({
        success: true,
        paymentData: {
          ...this.paymentForm.value,
          serviceTotal: this.data.serviceTotal,
          billingDate: new Date()
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}