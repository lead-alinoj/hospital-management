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
import { PdfService } from '../../service/pdf.service';

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
      <!-- Bill Summary -->
<div class="bill-summary">
  <h4>Bill Summary</h4>
  
  <div class="summary-section">
    <!-- Only show actual charges -->
    <div *ngIf="data.billItems && data.billItems.length > 0; else noItems">
      <!-- Group charges by category -->
      <div *ngFor="let category of getGroupedCharges()">
        <div class="category-header">{{ category.name }}</div>
        <div *ngFor="let item of category.items" class="bill-item">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-details">
            <span>{{ item.quantity }} × ₹{{ item.unitPrice | number:'1.2-2' }}</span>
            <span *ngIf="item.days"> × {{ item.days }} days</span>
            <strong>₹{{ item.totalPrice | number:'1.2-2' }}</strong>
          </div>
          <div *ngIf="item.instructions" class="item-instructions">
            <small>{{ item.instructions }}</small>
          </div>
        </div>
      </div>
    </div>
    
    <ng-template #noItems>
      <div class="no-items-message">
        <mat-icon>receipt</mat-icon>
        <p>No charges added to bill</p>
      </div>
    </ng-template>
    
    <mat-divider></mat-divider>
    
    <div class="summary-item">
      <span>Subtotal:</span>
      <span>₹{{ getSubtotal() | number:'1.2-2' }}</span>
    </div>
    <div class="summary-item grand-total">
      <strong>Grand Total:</strong>
      <strong>₹{{ getTotal() | number:'1.2-2' }}</strong>
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
        
        <div class="balance-info" *ngIf="paymentForm.get('paymentAmount')?.value < getTotal()">
  <mat-icon color="warn">warning</mat-icon>
  <span>Balance: ₹{{ getTotal() - (paymentForm.get('paymentAmount')?.value || 0) | number:'1.2-2' }}</span>
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
    .item-instructions {
  font-size: 12px;
  color: #666;
  font-style: italic;
  margin-top: 4px;
}

.category-header {
  font-weight: 600;
  color: #1976d2;
  padding: 10px 0 5px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 10px;
}

.no-items-message {
  text-align: center;
  padding: 30px;
  color: #666;
}

.no-items-message mat-icon {
  font-size: 48px;
  height: 48px;
  width: 48px;
  margin-bottom: 10px;
  color: #ccc;
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
    private pdfService = inject(PdfService); // Add this

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
      // Generate PDF first, then close dialog
      this.generateAndDownloadPDF().then(() => {
        this.dialogRef.close({
          success: true,
          paymentData: {
            ...this.paymentForm.value,
            totalAmount: this.data.total,
            billingDate: new Date()
          }
        });
      });
    }
  }
    private async generateAndDownloadPDF(): Promise<void> {
    try {
      const pdf = await this.pdfService.generateIPBillPDF(
        {
          billItems: this.data.billItems,
          subtotal: this.getSubtotal(),
          total: this.getTotal()
        },
        {
          paymentAmount: this.paymentForm.get('paymentAmount')?.value,
          paymentMethod: this.paymentForm.get('paymentMethod')?.value,
          insuranceId: this.paymentForm.get('insuranceId')?.value,
          notes: this.paymentForm.get('notes')?.value
        },
        this.data.patient,
        this.data.stayDays || 1
      );

      // Generate filename
      const patientName = this.data.patient.patient?.fullName || 'patient';
      const fileName = `IP_Bill_${patientName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
      
      // Save PDF
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Continue even if PDF fails
    }
  }
  getGroupedCharges(): any[] {
    if (!this.data.billItems || this.data.billItems.length === 0) {
      return [];
    }
    
    const categories: {[key: string]: {name: string, items: any[]}} = {};
    const categoryNames: {[key: string]: string} = {
      'ROOM': 'Room Charges',
      'DOCTOR': 'Doctor Consultation',
      'NURSING': 'Nursing Care',
      'MEDICINE': 'Medicines',
      'CONSUMABLE': 'Consumables',
      'PROCEDURE': 'Procedures',
      'LAB': 'Lab Tests',
      'OTHER': 'Other Charges'
    };
    
    this.data.billItems.forEach((item: any) => {
      const category = item.categoryType || 'OTHER';
      if (!categories[category]) {
        categories[category] = {
          name: categoryNames[category] || category,
          items: []
        };
      }
      categories[category].items.push(item);
    });
    
    return Object.values(categories);
  }

  getSubtotal(): number {
    if (!this.data.billItems) return 0;
    return this.data.billItems.reduce((sum: number, item: any) => 
      sum + (item.totalPrice || 0), 0
    );
  }

  getTotal(): number {
    return this.getSubtotal(); // No tax for now
  }
  onCancel(): void {
    this.dialogRef.close();
  }
}