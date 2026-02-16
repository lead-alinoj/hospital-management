import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../auth/auth.service';
import { AddPaymentDialogComponent } from './add-payment-dialog.component';
import { Payment, PaymentService } from '../../../service/payment.service';

@Component({
  selector: 'app-payment-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <!-- Payment Summary Card -->
    <mat-card class="payment-summary-card">
      <mat-card-header>
        <mat-card-title>Payment Summary</mat-card-title>
        <span class="last-updated">Updated: {{ lastUpdated | date:'short' }}</span>
      </mat-card-header>

      <mat-card-content>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="label">
              <mat-icon>receipt</mat-icon>
              Total Bill Amount
            </div>
            <div class="value">₹{{ totalBillAmount | number:'1.2-2' }}</div>
          </div>

          <div class="summary-item">
            <div class="label">
              <mat-icon>payments</mat-icon>
              Paid Amount
            </div>
            <div class="value paid">₹{{ paidAmount | number:'1.2-2' }}</div>
          </div>

          <div class="summary-item">
            <div class="label">
              <mat-icon>pending_actions</mat-icon>
              Pending Amount
            </div>
            <div class="value pending">₹{{ pendingAmount | number:'1.2-2' }}</div>
          </div>

          <div class="summary-item">
            <div class="label">
              <mat-icon>account_balance_wallet</mat-icon>
              Status
            </div>
            <div class="value">
<mat-chip [color]="getStatusColor()" selected>
                  {{ paymentStatus }}
              </mat-chip>
            </div>
          </div>
        </div>

        <!-- Add Payment Button (Only for Reception & Admin) -->
        <div *ngIf="canAddPayment" class="action-button">
          <button mat-raised-button color="primary" (click)="openAddPaymentDialog()">
            <mat-icon>add_circle</mat-icon>
            Add Payment
          </button>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Payment History Table -->
    <div class="payment-history-section" *ngIf="payments.length > 0">
      <h3>Payment History</h3>
      
      <div class="table-container">
        <table class="payment-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment Mode</th>
              <th>Received By</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let payment of payments">
              <td>{{ payment.createdAt | date:'medium' }}</td>
              <td class="amount">₹{{ payment.amount | number:'1.2-2' }}</td>
              <td>
                <span class="payment-mode" [class]="payment.paymentMode.toLowerCase()">
                  {{ payment.paymentMode }}
                </span>
              </td>
              <td>
                <div class="received-by">
                  <span class="name">{{ payment.receivedBy.name || payment.receivedBy.role }}</span>
                  <small class="role">{{ payment.receivedBy.role }}</small>
                </div>
              </td>
              <td class="remarks">{{ payment.remarks || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- No Payments Message -->
    <div *ngIf="payments.length === 0" class="no-payments">
      <mat-icon>payments</mat-icon>
      <p>No payments recorded yet</p>
    </div>
  `,
  styles: [`
    .payment-summary-card {
      margin-bottom: 24px;
      background: linear-gradient(135deg, #8cc1e4 0%, #71afbe 100%);
      color: white;
    }

    .payment-summary-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .last-updated {
      font-size: 12px;
      opacity: 0.8;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }

    .summary-item .label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      opacity: 0.9;
    }

    .summary-item .value {
      font-size: 24px;
      font-weight: bold;
    }

    .value.paid {
      color: #4caf50;
    }

    .value.pending {
      color: #ff9800;
    }

    .action-button {
      text-align: center;
      margin-top: 20px;
    }

    .payment-history-section {
      margin-top: 30px;
    }

    .table-container {
      overflow-x: auto;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      margin-top: 16px;
    }

    .payment-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }

    .payment-table th {
      background: #f5f5f5;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #e0e0e0;
    }

    .payment-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .payment-table tr:hover {
      background: #f9f9f9;
    }

    .payment-mode {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .payment-mode.cash {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .payment-mode.upi {
      background: #e3f2fd;
      color: #1565c0;
    }

    .payment-mode.card {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .amount {
      font-weight: 600;
      color: #1976d2;
    }

    .received-by {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .received-by .name {
      font-weight: 500;
    }

    .received-by .role {
      font-size: 11px;
      color: #666;
    }

    .remarks {
      color: #666;
      font-style: italic;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .no-payments {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .no-payments mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
      color: #ccc;
    }

    @media (max-width: 768px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }
      
      .payment-table {
        font-size: 14px;
      }
    }
  `]
})
export class PaymentSummaryComponent implements OnInit, OnChanges {
  private authService = inject(AuthService);
  private paymentService = inject(PaymentService);
  private dialog = inject(MatDialog);

  @Input() visitId!: string;
  @Input() patientId!: string;
  @Input() totalBillAmount: number = 0;
  @Output() paymentAdded = new EventEmitter<void>();

  payments: Payment[] = [];
  paidAmount: number = 0;
  pendingAmount: number = 0;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' = 'PENDING';
  canAddPayment: boolean = false;
  lastUpdated: Date = new Date();

  ngOnInit(): void {
    this.checkUserPermissions();
    this.loadPayments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalBillAmount'] || changes['visitId']) {
      this.calculatePaymentSummary();
    }
  }

  private checkUserPermissions(): void {
    const user = this.authService.getCurrentUser();
    this.canAddPayment = user?.role === 'Reception' ||user?.role === 'Pharmacy' || user?.role === 'Admin';
  }

  private loadPayments(): void {
    if (!this.visitId) return;

    this.paymentService.getPayments(this.visitId).subscribe({
      next: (response) => {
        if (response.success) {
          this.payments = response.data || [];
          this.calculatePaymentSummary();
        }
      },
      error: (error) => {
        console.error('Error loading payments:', error);
      }
    });
  }

  private calculatePaymentSummary(): void {
    // Calculate paid amount from payment entries
    this.paidAmount = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate pending amount
    this.pendingAmount = Math.max(0, this.totalBillAmount - this.paidAmount);
    
    // Determine payment status
    if (this.paidAmount === 0) {
      this.paymentStatus = 'PENDING';
    } else if (this.paidAmount < this.totalBillAmount) {
      this.paymentStatus = 'PARTIAL';
    } else {
      this.paymentStatus = 'PAID';
    }

    this.lastUpdated = new Date();
  }

  getStatusColor(): string {
    switch (this.paymentStatus) {
      case 'PAID': return 'primary';
      case 'PARTIAL': return 'accent';
      case 'PENDING': return 'warn';
      default: return '';
    }
  }

  openAddPaymentDialog(): void {
    const dialogRef = this.dialog.open(AddPaymentDialogComponent, {
      width: '500px',
      data: {
        visitId: this.visitId,
        patientId: this.patientId,
        maxAmount: this.pendingAmount,
        currentPaid: this.paidAmount,
        totalBill: this.totalBillAmount
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadPayments(); // Refresh payments
        this.paymentAdded.emit(); // Notify parent
      }
    });
  }
}