import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MedicineService } from '../../service/medicine.service';
import { PrescriptionService } from '../../service/prescription.service';
import { AuthService } from '../../auth/auth.service';
import { PrescriptionDispenseDialog } from './prescription-dispense-dialog.component';
import { PdfService } from '../../service/pdf.service';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { forkJoin } from 'rxjs';
import { PrescriptionViewDialogComponent } from './prescription-view-dialog.component';

@Component({
  selector: 'app-pharmacy-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="pharmacy-dashboard">
      <div class="dashboard-header">
        <h1>
          <mat-icon>local_pharmacy</mat-icon>
          Pharmacy Dashboard
        </h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" routerLink="/pharmacy/medicines">
            <mat-icon>inventory</mat-icon>
            Manage Medicines
          </button>
          <button mat-raised-button color="accent" (click)="refreshDashboard()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Statistics Overview -->
      <div class="stats-overview">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon pending">
              <mat-icon>receipt_long</mat-icon>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ pendingPrescriptionsCount }}</span>
              <span class="stat-label">Pending Prescriptions</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon today">
              <mat-icon>today</mat-icon>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ todayDispensedCount }}</span>
              <span class="stat-label">Dispensed Today</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon low-stock">
              <mat-icon>warning</mat-icon>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ lowStockCount }}</span>
              <span class="stat-label">Low Stock Items</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon revenue">
              <mat-icon>currency_rupee</mat-icon>
            </div>
            <div class="stat-details">
              <span class="stat-value">₹{{ todayRevenue | number:'1.0-0' }}</span>
              <span class="stat-label">Today's Revenue</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Main Content Tabs -->
      <mat-tab-group>
        <!-- Pending Prescriptions Tab -->
        <mat-tab label="Pending Prescriptions">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Prescriptions Ready for Dispensing</mat-card-title>
                <mat-card-subtitle>Review and dispense medicines to patients</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div *ngIf="isLoading" class="loading-state">
                  <mat-spinner diameter="50"></mat-spinner>
                  <p>Loading prescriptions...</p>
                </div>

                <div *ngIf="!isLoading && pendingPrescriptions.length === 0" class="empty-state">
                  <mat-icon>check_circle</mat-icon>
                  <p>No pending prescriptions</p>
                  <p class="empty-subtext">All prescriptions have been dispensed</p>
                </div>

                <div class="prescriptions-grid" *ngIf="pendingPrescriptions.length > 0">
                  <mat-card *ngFor="let prescription of pendingPrescriptions" class="prescription-card">
                    <mat-card-header>
                      <div class="prescription-header">
                        <div>
                          <div class="patient-name">{{ prescription.patientId?.fullName }}</div>
                          <div class="prescription-meta">
                            <span class="meta-item">
                              <mat-icon>person</mat-icon>
                              {{ prescription.patientId?.age }}Y / {{ prescription.patientId?.gender }}
                            </span>
                            <span class="meta-item">
                              <mat-icon>badge</mat-icon>
                              OP: {{ prescription.patientId?.opNumber }}
                            </span>
                            <span class="meta-item">
                              <mat-icon>schedule</mat-icon>
                              {{ prescription.createdAt | date:'shortTime' }}
                            </span>
                          </div>
                        </div>
                        <mat-chip color="primary" highlighted>
                          Rx# {{ prescription._id?.substring(0, 8) }}
                        </mat-chip>
                      </div>
                    </mat-card-header>
                    
                    <mat-card-content>
                      <!-- Vitals Section -->
                      <div class="vitals-section" *ngIf="prescription.vitals || getVitalsForPrescription(prescription)">
                        <h4>Vitals</h4>
                        <div class="vitals-grid">
                          <span class="vital-item">
                            <strong>Pulse:</strong> {{ (prescription.vitals || getVitalsForPrescription(prescription))?.pulse || '-' }} bpm
                          </span>
                          <span class="vital-item">
                            <strong>Temp:</strong> {{ (prescription.vitals || getVitalsForPrescription(prescription))?.temperature || '-' }} °F
                          </span>
                          <span class="vital-item">
                            <strong>SpO₂:</strong> {{ (prescription.vitals || getVitalsForPrescription(prescription))?.spo2 || '-' }}%
                          </span>
                          <span class="vital-item">
                            <strong>RR:</strong> {{ (prescription.vitals || getVitalsForPrescription(prescription))?.respiratoryRate || '-' }} bpm
                          </span>
                        </div>
                      </div>
                      
                      <div class="diagnosis-section">
                        <strong>Diagnosis:</strong>
                        <span class="diagnosis-text">{{ prescription.diagnosis }}</span>
                      </div>
                      
                      <div class="medicines-section">
                        <h4>Medicines ({{ prescription.medicines?.length || 0 }})</h4>
                        <div class="medicines-list">
                          <div *ngFor="let med of prescription.medicines" class="medicine-item">
                            <div class="medicine-info">
                              <span class="medicine-name">{{ med.medicineName || med.name }}</span>
                              <span class="medicine-details">{{ med.strength }} | Qty: {{ med.quantity }} | ₹{{ med.unitPrice || med.price || 0 }}</span>
                            </div>
                            <div class="medicine-instructions">
                              <span class="frequency">{{ med.take || 'After Food' }}</span>
                              <span class="duration">for {{ med.days }} days</span>
                              <div class="timing" *ngIf="med.morning || med.noon || med.evening || med.night">
                                <span *ngIf="med.morning">M</span>
                                <span *ngIf="med.noon">N</span>
                                <span *ngIf="med.evening">E</span>
                                <span *ngIf="med.night">Nt</span>
                              </div>
                            </div>
                            <div class="medicine-status">
                              <mat-icon [color]="checkMedicineStock(med.medicineId || med._id) ? 'primary' : 'warn'"
                                [matTooltip]="getStockTooltip(med.medicineId || med._id)">
                                {{ getStockIcon(med.medicineId || med._id) }}
                              </mat-icon>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div class="doctor-info">
                        <span class="doctor-name">
                          <mat-icon>medical_services</mat-icon>
                          Dr. {{ prescription.doctorId?.name }}
                        </span>
                      </div>

                      <!-- Billing Summary -->
                      <div class="billing-section">
                        <h4>Billing Summary</h4>
                        <div class="billing-grid">
                          <span>Medicine Amount: ₹{{ prescription.totalAmount || 0 }}</span>
                          <span>Total: ₹{{ prescription.totalAmount || 0 }}</span>
                        </div>
                      </div>
                    </mat-card-content>
                    
                    <mat-card-actions>
                      <button mat-button color="primary" (click)="viewPrescription(prescription._id)">
                        <mat-icon>visibility</mat-icon>
                        View Details
                      </button>
                      <button mat-raised-button color="primary" 
                        [disabled]="!canDispensePrescription(prescription)"
                        (click)="dispensePrescriptionWithBilling(prescription)">
                        <mat-icon>local_shipping</mat-icon>
                        Dispense
                      </button>
                      <button mat-button color="warn" (click)="printPrescription(prescription)">
                        <mat-icon>print</mat-icon>
                        Print
                      </button>
                    </mat-card-actions>
                  </mat-card>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Today's Dispensed Tab -->
        <mat-tab label="Today's Dispensed">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Today's Dispensed Prescriptions</mat-card-title>
                <mat-card-subtitle>Prescriptions dispensed today</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div *ngIf="isLoading" class="loading-state">
                  <mat-spinner diameter="50"></mat-spinner>
                  <p>Loading dispensed prescriptions...</p>
                </div>

                <div class="table-container" *ngIf="!isLoading && todaysDispensed.length > 0">
                  <table mat-table [dataSource]="todaysDispensed" class="mat-elevation-z1">
                    
                    <ng-container matColumnDef="patient">
                      <th mat-header-cell *matHeaderCellDef>Patient</th>
                      <td mat-cell *matCellDef="let item">
                        {{ item.patientId?.fullName }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="time">
                      <th mat-header-cell *matHeaderCellDef>Dispensed Time</th>
                      <td mat-cell *matCellDef="let item">
                        {{ item.dispensedAt | date:'shortTime' }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="medicines">
                      <th mat-header-cell *matHeaderCellDef>Medicines</th>
                      <td mat-cell *matCellDef="let item">
                        {{ item.medicines?.length || 0 }} items
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="amount">
                      <th mat-header-cell *matHeaderCellDef>Amount</th>
                      <td mat-cell *matCellDef="let item">
                        ₹{{ item.paymentAmount || item.totalAmount || 0 | number:'1.2-2' }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="dispensedBy">
                      <th mat-header-cell *matHeaderCellDef>Dispensed By</th>
                      <td mat-cell *matCellDef="let item">
                        {{ item.dispensedBy?.name || 'Pharmacy Staff' }}
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="dispensedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: dispensedColumns;"></tr>
                  </table>
                </div>

                <div *ngIf="!isLoading && todaysDispensed.length === 0" class="empty-state">
                  <mat-icon>inventory_2</mat-icon>
                  <p>No prescriptions dispensed today</p>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Low Stock Alerts Tab -->
        <mat-tab label="Low Stock Alerts">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Low Stock Medicines</mat-card-title>
                <mat-card-subtitle>Medicines that need to be reordered</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div *ngIf="isLoading" class="loading-state">
                  <mat-spinner diameter="50"></mat-spinner>
                  <p>Loading low stock alerts...</p>
                </div>

                <div class="low-stock-grid" *ngIf="!isLoading && lowStockMedicines.length > 0">
                  <mat-card *ngFor="let medicine of lowStockMedicines" 
                    class="stock-alert-card"
                    [ngClass]="{'critical': medicine.stockQty === 0}">
                    
                    <mat-card-header>
                      <div class="alert-header">
                        <div class="alert-title">
                          <mat-icon color="warn">warning</mat-icon>
                          <span>{{ medicine.name }}</span>
                        </div>
                        <mat-chip [color]="medicine.stockQty === 0 ? 'warn' : 'accent'">
                          {{ medicine.stockQty === 0 ? 'OUT OF STOCK' : 'LOW STOCK' }}
                        </mat-chip>
                      </div>
                    </mat-card-header>
                    
                    <mat-card-content>
                      <div class="stock-details">
                        <div class="stock-item">
                          <span class="label">Current Stock:</span>
                          <span class="value">{{ medicine.stockQty }}</span>
                        </div>
                        <div class="stock-item">
                          <span class="label">Minimum Stock:</span>
                          <span class="value">{{ medicine.minStock }}</span>
                        </div>
                        <div class="stock-item">
                          <span class="label">Category:</span>
                          <span class="value">{{ medicine.category?.name || '-' }}</span>
                        </div>
                        <div class="stock-item">
                          <span class="label">Price:</span>
                          <span class="value">₹{{ medicine.price | number:'1.2-2' }}</span>
                        </div>
                      </div>
                      
                      <div class="action-section">
                        <button mat-button color="primary" 
                          [routerLink]="['/pharmacy/medicines']" 
                          [queryParams]="{edit: medicine._id}">
                          Update Stock
                        </button>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>

                <div *ngIf="!isLoading && lowStockMedicines.length === 0" class="empty-state">
                  <mat-icon>check_circle</mat-icon>
                  <p>All medicines are well stocked</p>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .pharmacy-dashboard {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    .dashboard-header h1 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
    }
    .header-actions {
      display: flex;
      gap: 15px;
    }
    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      text-align: center;
      transition: transform 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-5px);
    }
    .stat-card .mat-card-content {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
    }
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-icon.pending {
      background: #e3f2fd;
      color: #1976d2;
    }
    .stat-icon.today {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    .stat-icon.low-stock {
      background: #fff3e0;
      color: #f57c00;
    }
    .stat-icon.revenue {
      background: #e8f5e9;
      color: #388e3c;
    }
    .stat-icon mat-icon {
      font-size: 30px;
      height: 30px;
      width: 30px;
    }
    .stat-details {
      flex: 1;
    }
    .stat-value {
      display: block;
      font-size: 32px;
      font-weight: bold;
      line-height: 1;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
    }
    .tab-content {
      padding: 20px 0;
    }
    .loading-state {
      text-align: center;
      padding: 50px;
    }
    .loading-state p {
      margin-top: 15px;
      color: #666;
    }
    .empty-state {
      text-align: center;
      padding: 50px;
      color: #666;
    }
    .empty-state mat-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      margin-bottom: 15px;
      color: #ddd;
    }
    .empty-subtext {
      font-size: 14px;
      margin-top: 5px;
    }
    .prescriptions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      gap: 20px;
    }
    .prescription-card {
      cursor: pointer;
      transition: transform 0.2s;
    }
    .prescription-card:hover {
      transform: translateY(-3px);
    }
    .prescription-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }
    .patient-name {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 5px;
    }
    .prescription-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      font-size: 12px;
      color: #666;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .meta-item mat-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
    }
    .vitals-section {
      margin: 15px 0;
      padding: 10px;
      background: #f0f8ff;
      border-radius: 4px;
    }
    .vitals-section h4 {
      margin: 0 0 10px 0;
      color: #1976d2;
    }
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .vital-item {
      font-size: 14px;
    }
    .diagnosis-section {
      margin: 15px 0;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .diagnosis-text {
      margin-left: 10px;
      font-weight: normal;
    }
    .medicines-section {
      margin: 15px 0;
    }
    .medicines-section h4 {
      margin: 0 0 10px 0;
      color: #555;
    }
    .medicines-list {
      max-height: 200px;
      overflow-y: auto;
    }
    .medicine-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
    .medicine-item:last-child {
      border-bottom: none;
    }
    .medicine-info {
      flex: 2;
      display: flex;
      flex-direction: column;
    }
    .medicine-name {
      font-weight: 500;
    }
    .medicine-details {
      font-size: 12px;
      color: #666;
    }
    .medicine-instructions {
      flex: 1;
      text-align: center;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .timing {
      display: flex;
      gap: 4px;
      justify-content: center;
    }
    .timing span {
      background: #e3f2fd;
      color: #1976d2;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
    }
    .medicine-status {
      flex: 0 0 auto;
    }
    .doctor-info {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
    }
    .doctor-name {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #666;
    }
    .billing-section {
      margin-top: 15px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .billing-section h4 {
      margin: 0 0 10px 0;
      color: #555;
    }
    .billing-grid {
      display: flex;
      justify-content: space-between;
    }
    .mat-card-actions {
      display: flex;
      justify-content: space-between;
      padding: 16px !important;
    }
    .table-container {
      overflow-x: auto;
    }
    .dispensed-columns {
      width: 100%;
    }
    .low-stock-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .stock-alert-card {
      border-left: 4px solid #ff9800;
    }
    .stock-alert-card.critical {
      border-left-color: #f44336;
    }
    .alert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .alert-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 500;
    }
    .stock-details {
      margin: 15px 0;
    }
    .stock-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    .stock-item:last-child {
      border-bottom: none;
    }
    .stock-item .label {
      color: #666;
    }
    .stock-item .value {
      font-weight: 500;
    }
    .action-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 15px;
    }
    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
      }
      .header-actions {
        flex-wrap: wrap;
      }
      .prescriptions-grid {
        grid-template-columns: 1fr;
      }
      .stat-card .mat-card-content {
        flex-direction: column;
        gap: 10px;
      }
      .mat-card-actions {
        flex-direction: column;
        gap: 10px;
      }
    }
  `]
})
export class PharmacyDashboardComponent implements OnInit {
  private medicineService = inject(MedicineService);
  private prescriptionService = inject(PrescriptionService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private pdfService = inject(PdfService);
  private cdr = inject(ChangeDetectorRef);

  // Statistics
  pendingPrescriptionsCount = 0;
  todayDispensedCount = 0;
  lowStockCount = 0;
  todayRevenue = 0;

  // Data
  pendingPrescriptions: any[] = [];
  todaysDispensed: any[] = [];
  lowStockMedicines: any[] = [];
  allMedicines: any[] = [];

  // Display
  dispensedColumns = ['patient', 'time', 'medicines', 'amount', 'dispensedBy'];
  isLoading = false;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    // Load all data in parallel
    forkJoin({
      pending: this.prescriptionService.getPrescriptionsForPharmacy('Active'),
      dispensed: this.prescriptionService.getPrescriptionsForPharmacy('Completed'),
      lowStock: this.medicineService.getLowStockMedicines(),
      medicines: this.medicineService.getMedicines()
    }).subscribe({
      next: (results) => {
        // Handle pending prescriptions
        if (results.pending.success) {
          this.pendingPrescriptions = results.pending.data || [];
          this.pendingPrescriptionsCount = this.pendingPrescriptions.length;
        }

        // Handle dispensed prescriptions
        if (results.dispensed.success) {
          this.todaysDispensed = results.dispensed.data || [];
          this.todayDispensedCount = this.todaysDispensed.length;
          
          // Calculate today's revenue
          this.todayRevenue = this.todaysDispensed.reduce((total: number, prescription: any) => {
            return total + (prescription.paymentAmount || prescription.totalAmount || 0);
          }, 0);
        }

        // Handle low stock medicines
        if (results.lowStock.success) {
          this.lowStockMedicines = results.lowStock.data || [];
          this.lowStockCount = this.lowStockMedicines.length;
        }

        // Store all medicines for stock checking
        if (results.medicines.success) {
          this.allMedicines = results.medicines.data || [];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.showError('Failed to load dashboard data');
        this.isLoading = false;
      }
    });
  }

  checkMedicineStock(medicineId: string): boolean {
    const medicine = this.allMedicines.find(m => m._id === medicineId);
    if (!medicine) return false;
    
    // Check if stock is available (not zero)
    return medicine.stockQty > 0;
  }

  getStockTooltip(medicineId: string): string {
    const medicine = this.allMedicines.find(m => m._id === medicineId);
    if (!medicine) return 'Medicine not found';
    
    if (medicine.stockQty === 0) return 'Out of stock';
    if (medicine.stockQty <= medicine.minStock) return 'Low stock';
    return 'In stock';
  }

  getStockIcon(medicineId: string): string {
    const medicine = this.allMedicines.find(m => m._id === medicineId);
    if (!medicine) return 'help';
    
    if (medicine.stockQty === 0) return 'block';
    if (medicine.stockQty <= medicine.minStock) return 'warning';
    return 'check_circle';
  }

  canDispensePrescription(prescription: any): boolean {
    // Check if all medicines are available in stock
    if (!prescription.medicines || prescription.medicines.length === 0) {
      return false;
    }
    
    return prescription.medicines.every((med: any) => 
      this.checkMedicineStock(med.medicineId || med._id)
    );
  }

  getVitalsForPrescription(prescription: any): any {
    // This would be fetched from the backend in a real implementation
    // For now, return null or mock data
    return null;
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

 viewPrescription(prescriptionId: string): void {
  this.prescriptionService.getPrescriptionWithDetails(prescriptionId).subscribe({
    next: (res: any) => {
      if (res.success) {
        this.dialog.open(PrescriptionViewDialogComponent, {
          width: '750px',
          data: res.data
        });
      }
    },
    error: () => this.showError('Unable to load prescription details')
  });
}


  dispensePrescriptionWithBilling(prescription: any): void {
    const dialogRef = this.dialog.open(PrescriptionDispenseDialog, {
      width: '500px',
      data: {
        prescription: prescription,
        totalAmount: prescription.totalAmount || 0
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.completeDispensing(prescription._id, result);
      }
    });
  }

  completeDispensing(prescriptionId: string, paymentData: any): void {
    this.isLoading = true;
    
    // Create combined data object with both prescriptionId and paymentData
    const dispenseData = {
      prescriptionId: prescriptionId,
      ...paymentData
    };
    
    this.prescriptionService.markAsDispensed(dispenseData).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Update local state
          const index = this.pendingPrescriptions.findIndex((p: any) => p._id === prescriptionId);
          if (index > -1) {
            const dispensedPrescription = this.pendingPrescriptions[index];
            this.pendingPrescriptions.splice(index, 1);
            
            // Add to today's dispensed
            this.todaysDispensed.unshift({
              ...dispensedPrescription,
              dispensedAt: new Date(),
              paymentData: paymentData
            });
            
            // Update statistics
            this.pendingPrescriptionsCount = this.pendingPrescriptions.length;
            this.todayDispensedCount = this.todaysDispensed.length;
            this.todayRevenue += paymentData.paymentAmount;
            
            // Generate PDF invoice
            this.generateInvoice(dispensedPrescription, paymentData);
            
            this.showSuccess('Prescription dispensed successfully!');
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error dispensing prescription:', error);
        this.showError('Error dispensing prescription');
        this.isLoading = false;
      }
    });
  }

  generateInvoice(prescription: any, billingData: any): void {
    // Add billing data to prescription
    const prescriptionWithBilling = {
      ...prescription,
      billing: {
        medicineAmount: prescription.totalAmount || 0,
        labCharges: billingData.labCharges || 0,
        consultationFee: billingData.consultationFee || 0,
        otherCharges: billingData.otherCharges || 0,
        totalAmount: billingData.paymentAmount || prescription.totalAmount || 0
      }
    };
    
    this.pdfService.generateHospitalVisitPDF(prescriptionWithBilling, null, prescriptionWithBilling.billing)
      .then((pdf: jsPDF) => {
        const patientName = prescription.patientId?.fullName?.replace(/\s+/g, '_') || 'invoice';
        const date = new Date().toISOString().split('T')[0];
        const filename = `Invoice_${patientName}_${date}.pdf`;
        pdf.save(filename);
      })
      .catch(error => {
        console.error('Error generating PDF:', error);
      });
  }

  printPrescription(prescription: any): void {
  this.pdfService.generateHospitalVisitPDF(
    prescription,
    prescription.vitals || null,
    prescription.billing || null
  ).then(pdf => {
    pdf.save(`Prescription_${prescription.patientId.fullName}_${Date.now()}.pdf`);
  });
}

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}