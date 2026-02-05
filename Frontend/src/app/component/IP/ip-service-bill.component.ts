import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { MedicineService } from '../../service/medicine.service';
import { AuthService } from '../../auth/auth.service';
import { IpAdmissionService } from '../../service/ip-admission.service';
import { ManualChargeDialogComponent } from './manual-charge-dialog.component';
import { ServiceBillPaymentDialogComponent } from './service-bill-payment-dialog.component';
import { MatDividerModule } from "@angular/material/divider";

@Component({
  selector: 'app-ip-service-bill',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule
],
  template: `
    <div class="service-bill-container">
      <!-- Header -->
      <div class="header-section">
        <h1>
          <mat-icon>receipt_long</mat-icon>
          IP Service Bill
        </h1>
        <p class="subtitle">Manage room, nursing, doctor & procedure charges</p>
      </div>

      <!-- Patient Selection -->
      <div class="patient-selection" *ngIf="!selectedPatient">
        <h3>Select Patient for Service Bill</h3>
        <div class="patient-grid">
          <mat-card *ngFor="let patient of activePatients" 
                    class="patient-card"
                    (click)="selectPatient(patient)">
            <mat-card-header>
              <div class="patient-avatar">
                <mat-icon>person</mat-icon>
              </div>
              <div class="patient-info">
                <mat-card-title>{{ patient.patient?.fullName }}</mat-card-title>
                <mat-card-subtitle>
                  OP: {{ patient.patient?.opNumber }} | 
                  Room: {{ patient.bedAllocated?.room?.roomNumber }} |
                  Bed: {{ patient.bedAllocated?.bedNumber }}
                </mat-card-subtitle>
              </div>
            </mat-card-header>
            
            <mat-card-content>
              <div class="patient-details">
                <p><strong>Admitted:</strong> {{ patient.admissionDate | date:'shortDate' }}</p>
                <p><strong>Stay:</strong> {{ calculateStayDays(patient.admissionDate) }} days</p>
                <p><strong>Doctor:</strong> Dr. {{ patient.doctor?.name }}</p>
              </div>
              
              <div class="bill-summary-preview">
                <div class="summary-item">
                  <span>Service Charges:</span>
                  <span class="amount">₹{{ getPatientServiceTotal(patient) | number:'1.2-2' }}</span>
                </div>
                <div class="summary-item">
                  <span>Pharmacy Balance:</span>
                  <span class="amount">₹{{ getPharmacyBalance(patient) | number:'1.2-2' }}</span>
                </div>
              </div>
            </mat-card-content>
            
            <mat-card-actions>
              <button mat-stroked-button color="primary" (click)="selectPatient(patient)">
                View Service Bill
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>

      <!-- Service Bill Management -->
      <div *ngIf="selectedPatient" class="service-bill-section">
        <!-- Patient Header -->
        <div class="patient-header">
          <button mat-button (click)="selectedPatient = null; serviceItems = []">
            <mat-icon>arrow_back</mat-icon> Back to Patients
          </button>
          
          <div class="patient-details-header">
            <h2>{{ selectedPatient.patient?.fullName }}</h2>
            <div class="patient-meta">
              <span class="meta-item">
                <mat-icon>badge</mat-icon>
                OP: {{ selectedPatient.patient?.opNumber }}
              </span>
              <span class="meta-item">
                <mat-icon>hotel</mat-icon>
                Room: {{ selectedPatient.bedAllocated?.room?.roomNumber }} | Bed: {{ selectedPatient.bedAllocated?.bedNumber }}
              </span>
              <span class="meta-item">
                <mat-icon>calendar_today</mat-icon>
                Stay: {{ calculateStayDays(selectedPatient.admissionDate) }} days
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-bar">
          <button mat-raised-button color="primary" (click)="addServiceCharge()">
            <mat-icon>add_circle</mat-icon> Add Service Charge
          </button>
          <!-- <button mat-raised-button color="accent" (click)="addRoomCharge()">
            <mat-icon>hotel</mat-icon> Add Room Charge
          </button> -->
          <button mat-raised-button color="warn" (click)="generateServiceBill()" 
                  [disabled]="serviceItems.length === 0 || serviceTotal <= 0">
            <mat-icon>receipt</mat-icon> Generate Service Bill
          </button>
        </div>

        <!-- Service Items Table -->
        <div class="table-section" *ngIf="serviceItems.length > 0">
          <h3>Service Charges</h3>
          
          <div class="table-container">
            <table mat-table [dataSource]="serviceItems" class="mat-elevation-z1">
              <!-- Date Column -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let item">
                  {{ item.createdAt | date:'dd/MM/yy' }}
                </td>
              </ng-container>
              
              <!-- Description Column -->
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let item">
                  <div class="description-cell">
                    <strong>{{ item.name }}</strong>
                    <small class="category-badge" [ngClass]="getCategoryClass(item.categoryType)">
                      {{ getCategoryLabel(item.categoryType) }}
                    </small>
                    <div *ngIf="item.instructions" class="notes">
                      {{ item.instructions }}
                    </div>
                  </div>
                </td>
              </ng-container>
              
              <!-- Quantity Column -->
              <ng-container matColumnDef="qty">
                <th mat-header-cell *matHeaderCellDef>Qty</th>
                <td mat-cell *matCellDef="let item">
                  {{ item.quantity }} {{ item.unit || 'nos' }}
                </td>
              </ng-container>
              
              <!-- Unit Price Column -->
              <ng-container matColumnDef="unitPrice">
                <th mat-header-cell *matHeaderCellDef>Unit Price</th>
                <td mat-cell *matCellDef="let item">
                  ₹{{ item.unitPrice | number:'1.2-2' }}
                </td>
              </ng-container>
              
              <!-- Total Column -->
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let item">
                  <strong>₹{{ item.totalPrice | number:'1.2-2' }}</strong>
                </td>
              </ng-container>
              
              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let item">
                  <mat-chip [color]="item.isBilled ? 'primary' : 'accent'">
                    {{ item.isBilled ? 'Billed' : 'Pending' }}
                  </mat-chip>
                </td>
              </ng-container>
              
              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let item">
                  <button mat-icon-button color="warn" 
                          *ngIf="!item.isBilled"
                          (click)="deleteServiceItem(item)"
                          matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </div>

        <!-- Service Bill Summary -->
        <div class="bill-summary-card">
          <div class="summary-header">
            <h3>Service Bill Summary</h3>
            <span class="last-updated">Updated: {{ lastUpdated | date:'short' }}</span>
          </div>
          
          <!-- Grouped by Category -->
          <div class="category-group" *ngIf="groupedCharges.length > 0">
            <div *ngFor="let group of groupedCharges" class="category-section">
              <div class="category-header">
                <mat-icon class="category-icon">{{ getCategoryIcon(group.category) }}</mat-icon>
                <span class="category-name">{{ group.name }}</span>
                <span class="category-total">₹{{ group.total | number:'1.2-2' }}</span>
              </div>
              
              <div *ngIf="group.items.length > 0" class="category-items">
                <div *ngFor="let item of group.items" class="category-item">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-details">
                    {{ item.quantity }} × ₹{{ item.unitPrice | number:'1.2-2' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- No Charges Message -->
          <div *ngIf="serviceItems.length === 0" class="no-charges">
            <mat-icon>receipt</mat-icon>
            <p>No service charges added yet</p>
            <p class="hint">Add room charges, nursing fees, or other service items</p>
          </div>
          
          <!-- Totals -->
          <div class="totals-section" *ngIf="serviceItems.length > 0">
            <mat-divider></mat-divider>
            
            <div class="total-row">
              <span>Service Subtotal</span>
              <span class="amount">₹{{ serviceTotal | number:'1.2-2' }}</span>
            </div>
            
            <!-- <div class="total-row">
              <span>Tax (GST 18%)</span>
              <span class="amount">₹{{ serviceTax | number:'1.2-2' }}</span>
            </div> -->
            
            <div class="total-row grand-total">
              <strong>Service Bill Total</strong>
              <strong class="amount">₹{{ serviceGrandTotal | number:'1.2-2' }}</strong>
            </div>
            
            <!-- Payment Status -->
            <div class="payment-status">
              <div class="status-item">
                <span>Billed Amount:</span>
                <span class="amount billed">₹{{ billedAmount | number:'1.2-2' }}</span>
              </div>
              <div class="status-item">
                <span>Pending Payment:</span>
                <span class="amount pending">₹{{ pendingAmount | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .service-bill-container {
      padding: 24px;
      background: #f8fafc;
      min-height: 100vh;
    }

    .header-section {
      margin-bottom: 30px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      border-left: 4px solid #1976d2;
    }

    .header-section h1 {
      display: flex;
      align-items: center;
      gap: 15px;
      margin: 0;
      color: #1976d2;
    }

    .header-section mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }

    .subtitle {
      margin: 8px 0 0 55px;
      color: #666;
      font-size: 16px;
    }

    /* Patient Selection */
    .patient-selection {
      padding: 20px;
      background: white;
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .patient-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .patient-card {
      cursor: pointer;
      transition: all 0.3s;
      border: 2px solid transparent;
    }

    .patient-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      border-color: #bbdefb;
    }

    .patient-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
    }

    .patient-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #e3f2fd;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .patient-avatar mat-icon {
      color: #1976d2;
      font-size: 28px;
    }

    .patient-info {
      flex: 1;
    }

    .patient-details {
      margin: 15px 0;
    }

    .patient-details p {
      margin: 5px 0;
      font-size: 14px;
      color: #555;
    }

    .bill-summary-preview {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 8px;
      margin-top: 10px;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }

    .summary-item .amount {
      font-weight: 500;
    }

    /* Service Bill Section */
    .service-bill-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 15px rgba(0,0,0,0.1);
    }

    .patient-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }

    .patient-details-header {
      flex: 1;
    }

    .patient-details-header h2 {
      margin: 0;
      color: #2c3e50;
    }

    .patient-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-top: 10px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
    }

    .meta-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Action Bar */
    .action-bar {
      display: flex;
      gap: 15px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    /* Table */
    .table-section {
      margin-bottom: 30px;
    }

    .table-section h3 {
      margin: 0 0 15px 0;
      color: #2c3e50;
    }

    .table-container {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .description-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .category-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      width: fit-content;
    }

    .category-room { background: #e3f2fd; color: #1976d2; }
    .category-nursing { background: #f3e5f5; color: #7b1fa2; }
    .category-doctor { background: #e8f5e9; color: #2e7d32; }
    .category-procedure { background: #fff3e0; color: #ef6c00; }
    .category-lab { background: #fce4ec; color: #c2185b; }
    .category-other { background: #f5f5f5; color: #616161; }

    .notes {
      font-size: 12px;
      color: #666;
      font-style: italic;
      margin-top: 4px;
    }

    /* Bill Summary */
    .bill-summary-card {
      background: #f9f9f9;
      border-radius: 12px;
      padding: 24px;
      border: 2px solid #e0e0e0;
    }

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e0e0e0;
    }

    .summary-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .last-updated {
      font-size: 12px;
      color: #666;
    }

    /* Category Groups */
    .category-group {
      margin-bottom: 30px;
    }

    .category-section {
      margin-bottom: 20px;
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: white;
      border-radius: 8px;
      margin-bottom: 10px;
      border-left: 4px solid;
    }

    .category-icon {
      color: #666;
    }

    .category-name {
      flex: 1;
      font-weight: 500;
      color: #333;
    }

    .category-total {
      font-weight: bold;
      color: #1976d2;
    }

    .category-items {
      margin-left: 44px;
    }

    .category-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: white;
      margin-bottom: 5px;
      border-radius: 6px;
      font-size: 14px;
    }

    .item-name {
      color: #555;
    }

    .item-details {
      color: #666;
    }

    /* No Charges */
    .no-charges {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .no-charges mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
      color: #ccc;
    }

    .hint {
      font-size: 14px;
      color: #888;
      margin-top: 8px;
    }

    /* Totals Section */
    .totals-section {
      margin-top: 30px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 16px;
      border-bottom: 1px dashed #ddd;
    }

    .total-row:last-child {
      border-bottom: none;
    }

    .grand-total {
      font-size: 18px;
      color: #1976d2;
      font-weight: bold;
      margin-top: 10px;
      padding-top: 15px;
      border-top: 2px solid #ddd;
    }

    .amount {
      font-weight: 500;
    }

    .amount.billed { color: #2e7d32; }
    .amount.pending { color: #f44336; }

    .payment-status {
      background: #f0f8ff;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .service-bill-container {
        padding: 16px;
      }

      .patient-grid {
        grid-template-columns: 1fr;
      }

      .patient-meta {
        flex-direction: column;
        gap: 10px;
      }

      .action-bar {
        flex-direction: column;
      }

      .action-bar button {
        width: 100%;
      }

      .table-container {
        font-size: 12px;
      }

      .category-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .category-items {
        margin-left: 0;
      }
    }
  `]
})
export class IpServiceBillComponent implements OnInit {
  private medicineService = inject(MedicineService);
  private ipService = inject(IpAdmissionService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Data
  activePatients: any[] = [];
  selectedPatient: any = null;
  serviceItems: any[] = [];
  
  // Calculations
  serviceTotal: number = 0;
  serviceTax: number = 0;
  serviceGrandTotal: number = 0;
  billedAmount: number = 0;
  pendingAmount: number = 0;
  groupedCharges: any[] = [];
  lastUpdated: Date = new Date();

  // Table
  displayedColumns = ['date', 'description', 'qty', 'unitPrice', 'total', 'status', 'actions'];

  ngOnInit(): void {
    this.loadActivePatients();
  }

  private loadActivePatients(): void {
    this.ipService.getCurrentIPPatients().subscribe({
      next: (response: any) => {
        this.activePatients = response.data || [];
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.snackBar.open('Error loading patients', 'Close', { duration: 3000 });
      }
    });
  }

  selectPatient(patient: any): void {
    this.selectedPatient = patient;
    this.loadServiceItems(patient._id);
  }

private loadServiceItems(visitId: string): void {
  console.log('🔄 Loading service items for visit:', visitId);
  
  this.medicineService.getIPServiceItems(visitId).subscribe({
    next: (response: any) => {
      console.log('✅ Service items loaded:', response);
      if (response.success) {
        this.serviceItems = response.data || [];
        this.calculateServiceBill();
      } else {
        this.serviceItems = [];
        console.error('❌ API returned error:', response);
      }
    },
    error: (err) => {
      console.error('❌ Error loading service items:', err);
      this.serviceItems = [];
      this.snackBar.open('Error loading service items', 'Close', { duration: 3000 });
    }
  });
}

  private calculateServiceBill(): void {
    // Filter only service bill items
    const serviceItems = this.serviceItems.filter(item => 
      this.isServiceCategory(item.categoryType)
    );

    // Calculate totals
    this.serviceTotal = serviceItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    // this.serviceTax = this.serviceTotal * 0.18; // 18% GST
    this.serviceGrandTotal = this.serviceTotal; // + this.serviceTax;

    // Calculate billed vs pending
    const billedItems = serviceItems.filter(item => item.isBilled);
    this.billedAmount = billedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    this.pendingAmount = this.serviceGrandTotal - this.billedAmount;

    // Group charges by category
    this.groupChargesByCategory();

    this.lastUpdated = new Date();
  }

  private groupChargesByCategory(): void {
    const groups: any = {};
    
    this.serviceItems.filter(item => this.isServiceCategory(item.categoryType)).forEach(item => {
      const category = item.categoryType || 'OTHER';
      if (!groups[category]) {
        groups[category] = {
          category: category,
          name: this.getCategoryLabel(category),
          total: 0,
          items: []
        };
      }
      groups[category].total += item.totalPrice || 0;
      groups[category].items.push(item);
    });
    
    this.groupedCharges = Object.values(groups);
  }

  // Category helpers
  isServiceCategory(category: string): boolean {
    const serviceCategories = ['ROOM', 'NURSING', 'DOCTOR', 'PROCEDURE', 'LAB', 'CONSULTATION', 'OTHER'];
    return serviceCategories.includes(category);
  }

  getCategoryLabel(category: string): string {
    const labels: {[key: string]: string} = {
      'ROOM': 'Room Charges',
      'NURSING': 'Nursing Care',
      'DOCTOR': 'Doctor Consultation',
      'PROCEDURE': 'Procedures',
      'LAB': 'Lab Tests',
      'CONSULTATION': 'Consultations',
      'OTHER': 'Other Charges'
    };
    return labels[category] || category;
  }

  getCategoryIcon(category: string): string {
    const icons: {[key: string]: string} = {
      'ROOM': 'hotel',
      'NURSING': 'healing',
      'DOCTOR': 'medical_services',
      'PROCEDURE': 'medical_services',
      'LAB': 'science',
      'CONSULTATION': 'groups',
      'OTHER': 'receipt'
    };
    return icons[category] || 'receipt';
  }

  getCategoryClass(category: string): string {
    const classes: {[key: string]: string} = {
      'ROOM': 'category-room',
      'NURSING': 'category-nursing',
      'DOCTOR': 'category-doctor',
      'PROCEDURE': 'category-procedure',
      'LAB': 'category-lab',
      'OTHER': 'category-other'
    };
    return classes[category] || 'category-other';
  }

  // Patient calculations
  calculateStayDays(admissionDate: string): number {
    if (!admissionDate) return 0;
    const admission = new Date(admissionDate);
    const today = new Date();
    const diffTime = today.getTime() - admission.getTime();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  getPatientServiceTotal(patient: any): number {
    // Mock calculation - you'll need to implement actual logic
    const days = this.calculateStayDays(patient.admissionDate);
    const roomRate = patient.bedAllocated?.room?.chargesPerDay || 500;
    return days * roomRate;
  }

  getPharmacyBalance(patient: any): number {
    // Mock calculation - you'll need to implement actual logic
    return 0;
  }

  // Action methods
  addServiceCharge(): void {
    const dialogRef = this.dialog.open(ManualChargeDialogComponent, {
      width: '500px',
      data: {
        patient: this.selectedPatient.patient,
        visitId: this.selectedPatient._id,
        user: this.authService.getCurrentUser(),
        // Pre-select service categories only
        serviceMode: true
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        // Add as service bill item
        this.addServiceBillItem(result.data);
      }
    });
  }

  addRoomCharge(): void {
    const days = this.calculateStayDays(this.selectedPatient.admissionDate);
    const roomRate = this.selectedPatient.bedAllocated?.room?.chargesPerDay || 500;
    
    const dialogRef = this.dialog.open(ManualChargeDialogComponent, {
      width: '500px',
      data: {
        patient: this.selectedPatient.patient,
        visitId: this.selectedPatient._id,
        user: this.authService.getCurrentUser(),
        prefill: {
          description: `Room Charges (${days} days @₹${roomRate}/day)`,
          category: 'ROOM',
          amount: days * roomRate,
          quantity: days,
          unitPrice: roomRate
        },
        serviceMode: true
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.addServiceBillItem(result.data);
      }
    });
  }
private mapToValidCategory(category: string): string {
  const categoryMap: {[key: string]: string} = {
    'ROOM': 'ROOM',
    'NURSING': 'NURSING',
    'DOCTOR': 'DOCTOR',
    'CONSULTATION': 'DOCTOR',
    'PROCEDURE': 'Procedure',
    'LAB': 'Lab',
    'OTHER': 'OTHER'
  };
  
  return categoryMap[category] || 'OTHER';
}
 private addServiceBillItem(chargeData: any): void {
  console.log('📝 Adding service bill item:', chargeData);
  
  // Ensure all required fields are present
  const serviceItem = {
    visit: this.selectedPatient._id,
    patient: this.selectedPatient.patient._id,
    name: chargeData.description || 'Service Charge',
    categoryType: chargeData.category || 'OTHER',
    quantity: chargeData.quantity || 1,
    unitPrice: chargeData.unitPrice || (chargeData.amount / (chargeData.quantity || 1)),
    totalPrice: chargeData.amount,
    instructions: chargeData.notes || '',
    administeredBy: 'System',
    addedBy: {
      id: chargeData.user.id,
      name: chargeData.user.name,
      role: chargeData.user.role
    },
    isManual: true,
    billGroup: 'SERVICE',
    notes: chargeData.notes || ''
  };
  
  console.log('📤 Prepared service item:', serviceItem);
  
  this.medicineService.addManualBillItem(serviceItem).subscribe({
    next: (response: any) => {
      console.log('✅ Response:', response);
      if (response.success) {
        this.serviceItems.unshift(response.data);
        this.calculateServiceBill();
        this.snackBar.open('Service charge added successfully', 'Close', { duration: 3000 });
      } else {
        console.error('❌ API error:', response);
        this.snackBar.open(response.message || 'Failed to add charge', 'Close', { duration: 3000 });
      }
    },
    error: (err) => {
      console.error('❌ HTTP error:', err);
      this.snackBar.open('Error adding charge: ' + (err.error?.message || err.message), 'Close', { duration: 3000 });
    }
  });
}

  deleteServiceItem(item: any): void {
    if (confirm('Delete this service charge?')) {
      this.medicineService.deleteBillItem(item._id).subscribe({
        next: () => {
          this.serviceItems = this.serviceItems.filter(i => i._id !== item._id);
          this.calculateServiceBill();
          this.snackBar.open('Charge deleted', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Error deleting charge', 'Close', { duration: 3000 });
        }
      });
    }
  }

  generateServiceBill(): void {
    if (this.serviceTotal <= 0) {
      this.snackBar.open('No service charges to bill', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ServiceBillPaymentDialogComponent, {
      width: '600px',
      data: {
        patient: this.selectedPatient,
        serviceTotal: this.serviceGrandTotal,
        serviceItems: this.serviceItems.filter(item => !item.isBilled)
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.markServiceItemsAsBilled(result.paymentData);
      }
    });
  }

  private markServiceItemsAsBilled(paymentData: any): void {
    const itemIds = this.serviceItems
      .filter(item => !item.isBilled && this.isServiceCategory(item.categoryType))
      .map(item => item._id);
    
    if (itemIds.length === 0) return;
    
    const servicePaymentData = {
      ...paymentData,
      patientId: this.selectedPatient.patient._id,
      totalAmount: this.serviceGrandTotal,
      billType: 'SERVICE' // Mark as service bill payment
    };
    
    this.medicineService.markServiceBillItemsAsBilled(
      this.selectedPatient._id, 
      itemIds, 
      servicePaymentData
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Update local items
          this.serviceItems = this.serviceItems.map(item => 
            itemIds.includes(item._id) ? { ...item, isBilled: true } : item
          );
          this.calculateServiceBill();
          this.snackBar.open('Service bill generated', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.snackBar.open('Error generating bill', 'Close', { duration: 3000 });
      }
    });
  }
}