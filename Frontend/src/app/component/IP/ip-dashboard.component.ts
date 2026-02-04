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
import { VisitService } from '../../service/visit.service';
import { BedService } from '../../service/bed.service';
import { DischargeDialogComponent } from '../reception/discharge-dialog.component';
import { FinalBillDialogComponent } from './final-bill-dialog.component';
import { Router } from '@angular/router';
import { IpAdmissionService } from '../../service/ip-admission.service';
import { IpRecommendationDialogComponent } from '../doctor/ip-recommendation-dialog.component';
import { AuthService } from '../../auth/auth.service';
import { MedicineService } from '../../service/medicine.service';
import { PrescriptionService } from '../../service/prescription.service';
import { ManualChargeDialogComponent } from './manual-charge-dialog.component';
import { AddIpMedicineDialogComponent } from './add-ip-medicine-dialog.component';
import { EditBillItemDialogComponent } from './edit-bill-item-dialog.component';
@Component({
  selector: 'app-ip-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="ip-dashboard">
      <h1>In-Patient Management</h1>
      
      <mat-tab-group>
    // In ip-dashboard.component.html - Update the IP Billing tab
<mat-tab label="IP Billing">
  <div class="tab-content">
    <!-- Patient Selection for Billing -->
    <div class="patient-selection" *ngIf="!selectedPatient">
      <h3>Select Patient to View/Add Bill</h3>
      <div class="patient-grid">
        <mat-card *ngFor="let patient of activePatients" 
                  class="patient-billing-card"
                  (click)="selectPatientForBilling(patient)">
          <mat-card-header>
            <mat-card-title>{{ patient.patient?.fullName }}</mat-card-title>
            <mat-card-subtitle>
              OP: {{ patient.patient?.opNumber }} | 
              Room: {{ patient.bedAllocated?.room?.roomNumber }} | 
              Bed: {{ patient.bedAllocated?.bedNumber }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p><strong>Admitted:</strong> {{ patient.admissionDate | date:'short' }}</p>
            <p><strong>Doctor:</strong> Dr. {{ patient.doctor?.name }}</p>
            <p><strong>Stay Duration:</strong> {{ calculateStayDays(patient.admissionDate) }} days</p>
            <p><strong>Current Bill:</strong> ₹{{ patient.currentBillAmount || 0 | number:'1.2-2' }}</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <!-- Bill Items for Selected Patient -->
    <div *ngIf="selectedPatient" class="billing-section">
      <div class="bill-header">
        <button mat-button (click)="selectedPatient = null; billItems = []">
          <mat-icon>arrow_back</mat-icon> Back to Patients
        </button>
        <h3>Bill Items for {{ selectedPatient.patient?.fullName }}</h3>
        <div class="bill-actions">
          <button mat-raised-button color="primary" (click)="addBillItem(selectedPatient)">
            <mat-icon>add</mat-icon> Add Bill Item
          </button>
          <button mat-raised-button color="accent" (click)="addManualCharge(selectedPatient)">
            <mat-icon>receipt</mat-icon> Add Manual Charge
          </button>
          <button mat-raised-button color="warn" (click)="generateFinalBill(selectedPatient)" 
                  [disabled]="billItems.length === 0">
            <mat-icon>download</mat-icon> Generate Final Bill
          </button>
        </div>
      </div>
      
      <!-- Bill Items Table -->
      <div class="bill-items-section" *ngIf="billItems.length > 0">
        <div class="table-container">
          <table mat-table [dataSource]="billItems" class="mat-elevation-z1">
            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date & Time</th>
              <td mat-cell *matCellDef="let item">
                {{ item.createdAt | date:'medium' }}
              </td>
            </ng-container>
            
            <!-- Item Name Column -->
            <ng-container matColumnDef="item">
              <th mat-header-cell *matHeaderCellDef>Item Description</th>
              <td mat-cell *matCellDef="let item">
                <div class="item-details">
                  <strong>{{ item.name }}</strong>
                  <small *ngIf="item.categoryType" class="category-badge">
                    {{ item.categoryType }}
                  </small>
                  <div *ngIf="item.instructions" class="instructions">
                    {{ item.instructions }}
                  </div>
                </div>
              </td>
            </ng-container>
            
            <!-- Qty Column -->
            <ng-container matColumnDef="qty">
              <th mat-header-cell *matHeaderCellDef>Qty</th>
              <td mat-cell *matCellDef="let item">
                {{ item.quantity }} {{ item.unit || 'nos' }}
                <div *ngIf="item.days" class="days-info">
                  × {{ item.days }} days
                </div>
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
            
            <!-- Added By Column -->
            <ng-container matColumnDef="addedBy">
              <th mat-header-cell *matHeaderCellDef>Added By</th>
              <td mat-cell *matCellDef="let item">
                <div class="added-by">
                  <span>{{ item.addedBy?.name || 'System' }}</span>
                  <small>{{ item.addedBy?.role }}</small>
                </div>
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
                <button mat-icon-button color="primary" 
                        (click)="editBillItem(item)"
                        matTooltip="Edit item">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" 
                        (click)="deleteBillItem(item)"
                        matTooltip="Delete item">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="billColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: billColumns;"></tr>
          </table>
        </div>
        
        <!-- Bill Summary -->
        <div class="bill-summary-card">
          <div class="summary-header">
            <h4>Bill Summary</h4>
            <span class="last-updated">Updated: {{ lastUpdated | date:'medium' }}</span>
          </div>
          
          <div class="summary-grid">
            <!-- Itemized Charges -->
            <div class="summary-section">
              <h5>Itemized Charges</h5>
              <div class="summary-item" *ngFor="let category of itemizedCharges">
                <span>{{ category.name }}</span>
                <span>₹{{ category.amount | number:'1.2-2' }}</span>
              </div>
            </div>
            
            <!-- Room Charges -->
            <div class="summary-section">
              <h5>Room Charges</h5>
              <div class="summary-item">
                <span>Room Charges ({{ stayDays }} days)</span>
                <span>₹{{ roomCharges | number:'1.2-2' }}</span>
              </div>
              <div class="summary-item">
                <span>Doctor Consultation</span>
                <span>₹{{ doctorFees | number:'1.2-2' }}</span>
              </div>
              <div class="summary-item">
                <span>Nursing Charges</span>
                <span>₹{{ nursingCharges | number:'1.2-2' }}</span>
              </div>
            </div>
            
            <!-- Total Section -->
            <div class="summary-section total-section">
              <div class="summary-item">
                <span>Subtotal:</span>
                <span>₹{{ calculateSubtotal() | number:'1.2-2' }}</span>
              </div>
              <div class="summary-item">
                <span>Tax (GST 18%):</span>
                <span>₹{{ calculateTax() | number:'1.2-2' }}</span>
              </div>
              <div class="summary-item grand-total">
                <strong>Grand Total:</strong>
                <strong>₹{{ calculateGrandTotal() | number:'1.2-2' }}</strong>
              </div>
            </div>
          </div>
          
          <!-- Payment Status -->
          <div class="payment-status">
            <mat-chip-set>
              <mat-chip [color]="paymentStatus === 'PAID' ? 'primary' : undefined"
                        [highlighted]="paymentStatus === 'PAID'">
                Paid: ₹{{ paidAmount | number:'1.2-2' }}
              </mat-chip>
              <mat-chip [color]="paymentStatus === 'PENDING' ? 'warn' : undefined"
                        [highlighted]="paymentStatus === 'PENDING'">
                Pending: ₹{{ pendingAmount | number:'1.2-2' }}
              </mat-chip>
              <mat-chip [color]="paymentStatus === 'PARTIAL' ? 'accent' : undefined"
                        [highlighted]="paymentStatus === 'PARTIAL'">
                Balance: ₹{{ balanceAmount | number:'1.2-2' }}
              </mat-chip>
            </mat-chip-set>
          </div>
        </div>
      </div>
      
      <!-- No Bill Items State -->
      <div *ngIf="billItems.length === 0" class="no-bill-items">
        <mat-icon>receipt</mat-icon>
        <p>No bill items added yet</p>
        <p class="empty-subtext">Start by adding medicines, consumables, or manual charges</p>
        <div class="action-buttons">
          <button mat-raised-button color="primary" (click)="addBillItem(selectedPatient)">
            <mat-icon>medication</mat-icon> Add Medicine
          </button>
          <button mat-raised-button color="accent" (click)="addManualCharge(selectedPatient)">
            <mat-icon>receipt</mat-icon> Add Manual Charge
          </button>
        </div>
      </div>
    </div>
  </div>
</mat-tab>

<!-- In ip-dashboard.component.html - Update the IP Recommendations tab -->
<mat-tab label="IP Recommendations">
  <div class="cards-grid" *ngIf="recommendedPatients.length > 0">
    <mat-card *ngFor="let r of recommendedPatients" class="patient-card">
      <mat-card-header>
        <mat-card-title>{{ r.patient?.fullName || 'Unknown Patient' }}</mat-card-title>
        <mat-card-subtitle>
          OP: {{ r.patient?.opNumber || 'N/A' }} |
          {{ r.patient?.age || 'N/A' }}Y / {{ r.patient?.gender || 'N/A' }}
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <p><b>Recommended By:</b> {{ r.recommendedByRole || 'Doctor' }}</p>
        <p><b>Doctor:</b> Dr. {{ r.doctor?.name || 'Not specified' }}</p>
        <p><b>Diagnosis:</b> {{ r.diagnosis || 'No diagnosis' }}</p>
        <p><b>Admission Type:</b> {{ r.admissionType || 'DOCTOR_ADVISED' }}</p>

        <!-- VITALS -->
        <div class="vitals-box" *ngIf="r.vitals">
          <b>Vitals:</b>
          <span *ngIf="r.vitals.bloodPressure?.systolic">
            BP {{ r.vitals.bloodPressure.systolic }}/{{ r.vitals.bloodPressure.diastolic }},
          </span>
          <span *ngIf="r.vitals.pulse">Pulse {{ r.vitals.pulse }}, </span>
          <span *ngIf="r.vitals.spo2">SpO₂ {{ r.vitals.spo2 }}%</span>
        </div>

        <!-- MEDICINES -->
        <div class="medicine-box" *ngIf="r.medicines?.length > 0">
          <h4>Medicines</h4>
          <table class="history-table">
            <tr *ngFor="let m of r.medicines">
              <td>{{ m.medicineName }}</td>
              <td>{{ m.quantity }} × {{ m.days }} days</td>
              <td>{{ m.take }}</td>
            </tr>
          </table>
        </div>
        
        <div *ngIf="!r.medicines || r.medicines.length === 0" class="no-medicines">
          <p><em>No medicines prescribed</em></p>
        </div>
      </mat-card-content>

      <mat-card-actions align="end">
        <button
          mat-raised-button
          color="primary"
          (click)="admitPatient(r)"
          [disabled]="!r.visitId">
          Allocate Bed
        </button>
      </mat-card-actions>
    </mat-card>
  </div>

  <div *ngIf="recommendedPatients.length === 0" class="no-data">
    <mat-icon>hotel</mat-icon>
    <p>No IP recommendations available</p>
    <small>When doctors recommend IP admission during consultation, they will appear here.</small>
  </div>
</mat-tab>

        <!-- Active IP Patients -->
        <mat-tab label="Active Patients">
          <div class="tab-content">
            <div class="cards-grid" *ngIf="activePatients.length > 0">
              <mat-card *ngFor="let patient of activePatients" class="patient-card">
                <mat-card-header>
                  <mat-card-title>{{ patient.patient?.fullName }}</mat-card-title>
                  <mat-card-subtitle>
                    OP: {{ patient.patient?.opNumber }} | 
                    Room: {{ patient.bedAllocated?.room?.roomNumber }} | 
                    Bed: {{ patient.bedAllocated?.bedNumber }}
                  </mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="patient-details">
                    <p><strong>Admission Date:</strong> {{ patient.admissionDate | date:'medium' }}</p>
                    <p><strong>Admission Type:</strong> {{ patient.admissionType }}</p>
                    <p><strong>Doctor:</strong> Dr. {{ patient.doctor?.name }}</p>
                    <p><strong>Chief Complaint:</strong> {{ patient.chiefComplaint }}</p>
                    
                    <div class="actions">
                      <button mat-button color="primary" (click)="addMedicine(patient)">
                        <mat-icon>medication</mat-icon> Add Medicine
                      </button>
                      <button mat-button color="accent" (click)="viewVitals(patient)">
                        <mat-icon>monitor_heart</mat-icon> Vitals
                      </button>
                      <button mat-button color="warn" (click)="dischargePatient(patient)">
                        <mat-icon>logout</mat-icon> Discharge
                      </button>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
            
            <div *ngIf="activePatients.length === 0" class="no-data">
              <mat-icon>hotel</mat-icon>
              <p>No active in-patients</p>
            </div>
          </div>
        </mat-tab>
        
    <!-- Bed Status Tab -->
<mat-tab label="Bed Status">
  <div class="tab-content">
    <div class="beds-overview">
      <div class="stats">
        <mat-card class="stat-card">
          <mat-card-content>
            <h3>Total Beds</h3>
            <p class="stat-number">{{ bedStats.total }}</p>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card available">
          <mat-card-content>
            <h3>Available</h3>
            <p class="stat-number">{{ bedStats.available }}</p>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card occupied">
          <mat-card-content>
            <h3>Occupied</h3>
            <p class="stat-number">{{ bedStats.occupied }}</p>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card maintenance">
          <mat-card-content>
            <h3>Maintenance</h3>
            <p class="stat-number">{{ bedStats.maintenance }}</p>
          </mat-card-content>
        </mat-card>
      </div>
      
      <div class="beds-list">
        <h3>All Beds</h3>
        <table mat-table [dataSource]="allBeds" class="mat-elevation-z1">
          <!-- Bed Number Column -->
          <ng-container matColumnDef="bedNumber">
            <th mat-header-cell *matHeaderCellDef>Bed No.</th>
            <td mat-cell *matCellDef="let bed">
              <mat-icon [style.color]="getBedColor(bed.status)">hotel</mat-icon>
              {{ bed.bedNumber }}
            </td>
          </ng-container>
          
          <!-- Room Column -->
          <ng-container matColumnDef="room">
            <th mat-header-cell *matHeaderCellDef>Room</th>
            <td mat-cell *matCellDef="let bed">
              {{ bed.room?.roomNumber }} ({{ bed.room?.type }})
            </td>
          </ng-container>
          
          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let bed">
              <mat-chip [color]="getStatusColor(bed.status)" selected>
                {{ bed.status }}
              </mat-chip>
            </td>
          </ng-container>
          
          <!-- Patient Column -->
          <ng-container matColumnDef="patient">
            <th mat-header-cell *matHeaderCellDef>Patient</th>
            <td mat-cell *matCellDef="let bed">
              {{ bed.currentPatient?.fullName || '-' }}
            </td>
          </ng-container>
          
          <!-- Admission Date Column -->
          <ng-container matColumnDef="admissionDate">
            <th mat-header-cell *matHeaderCellDef>Admission Date</th>
            <td mat-cell *matCellDef="let bed">
              {{ (bed.admissionDate ? (bed.admissionDate | date:'short') : '-') }}
            </td>
          </ng-container>
          
          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let bed">
              <!-- Fixed: Added null checks -->
              <button mat-icon-button 
                      *ngIf="bed && bed.status && bed.status === 'OCCUPIED'"
                      (click)="dischargeFromBed(bed)"
                      matTooltip="Discharge">
                <mat-icon>logout</mat-icon>
              </button>
            </td>
          </ng-container>
          
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  </div>
</mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .ip-dashboard { padding: 20px; }
    .cards-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px; 
      margin-top: 20px;
    }
    .patient-card { 
      transition: all 0.3s; 
      cursor: pointer;
    }
    .patient-card:hover { 
      transform: translateY(-5px); 
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    .patient-details p { margin: 5px 0; }
    .actions { 
      display: flex; 
      gap: 10px; 
      margin-top: 15px;
      flex-wrap: wrap;
    }
    .no-data { 
      text-align: center; 
      padding: 50px; 
      color: #666;
    }
    .no-data mat-icon { 
      font-size: 64px; 
      margin-bottom: 20px;
      color: #ccc;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-card { 
      text-align: center; 
      padding: 20px;
    }
    .stat-card.available { border-left: 4px solid #4CAF50; }
    .stat-card.occupied { border-left: 4px solid #F44336; }
    .stat-card.maintenance { border-left: 4px solid #FF9800; }
    .stat-number { 
      font-size: 36px; 
      font-weight: bold; 
      margin: 10px 0;
    }
    /* Add to ip-dashboard.component.css */
.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.bill-header h3 {
  margin: 0;
  color: white;
}

.bill-actions {
  display: flex;
  gap: 10px;
}

.bill-items-section {
  margin-top: 20px;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  display: inline-block;
}

.instructions {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.days-info {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.added-by {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.added-by small {
  font-size: 11px;
  color: #666;
}

.bill-summary-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 15px rgba(0,0,0,0.1);
  margin-top: 30px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.last-updated {
  font-size: 12px;
  color: #666;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 20px;
}

.summary-section {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 6px;
}

.summary-section h5 {
  margin: 0 0 15px 0;
  color: #333;
  font-weight: 600;
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

.total-section {
  background: #f0f8ff;
  border: 2px solid #1976d2;
}

.grand-total {
  font-size: 1.2em;
  color: #1976d2;
}

.payment-status {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.no-bill-items {
  text-align: center;
  padding: 60px 20px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-top: 20px;
}

.no-bill-items mat-icon {
  font-size: 64px;
  height: 64px;
  width: 64px;
  margin-bottom: 20px;
  color: #ccc;
}

.empty-subtext {
  color: #666;
  margin-bottom: 30px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .bill-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .bill-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .table-container {
    font-size: 12px;
  }
}
    /* Add to ip-dashboard.component.css */
.vitals-box {
  background: #f0f8ff;
  padding: 8px 12px;
  border-radius: 6px;
  margin: 10px 0;
  font-size: 14px;
}

.medicine-box {
  background: #f9f9f9;
  padding: 10px;
  border-radius: 6px;
  margin: 10px 0;
}
 .patient-selection {
    padding: 20px;
  }
  
  .patient-billing-card {
    cursor: pointer;
    transition: transform 0.2s;
    margin: 10px;
  }
  
  .patient-billing-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
  
  .bill-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 8px;
  }
  
  .bill-summary {
    margin-top: 30px;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 8px;
  }
  
  .summary-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
  }
  
  .summary-item.total {
    border-top: 2px solid #333;
    font-size: 1.2em;
    font-weight: bold;
    margin-top: 10px;
    padding-top: 15px;
  }
  
  .no-bill-items {
    text-align: center;
    padding: 40px;
    color: #666;
  }
  
  .no-bill-items mat-icon {
    font-size: 64px;
    margin-bottom: 20px;
    color: #ccc;
  }
.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.history-table td {
  padding: 4px 8px;
  border-bottom: 1px solid #eee;
}

.no-medicines {
  color: #888;
  font-style: italic;
  margin: 10px 0;
}
    .beds-list { margin-top: 20px; }
    table { width: 100%; }
    .tab-content { padding: 20px 0; }
  `]
})
export class IpDashboardComponent implements OnInit {


private ipAdmissionService = inject(IpAdmissionService);
private bedService = inject(BedService);
private dialog = inject(MatDialog);
private snackBar = inject(MatSnackBar);
private router = inject(Router);
private authService = inject(AuthService);
private medicineService = inject(MedicineService);
private visitService = inject(VisitService);
private prescriptionService = inject(PrescriptionService);
itemizedCharges: any[] = [];
paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL' = 'PENDING';
paidAmount: number = 0;
pendingAmount: number = 0;
balanceAmount: number = 0;
lastUpdated: Date = new Date();
nursingCharges: number = 0;
   selectedPatient: any = null;
  billItems: any[] = [];
  billColumns = ['date', 'item', 'qty', 'unitPrice', 'total', 'addedBy', 'status','actions'];
  stayDays: number = 0;
  roomCharges: number = 0;
  doctorFees: number = 500; // Default or calculate dynamically

  activePatients: any[] = [];
  allBeds: any[] = [];
  bedStats = {
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0
  };
  recommendedPatients: any[] = [];

  displayedColumns = ['bedNumber', 'room', 'status', 'patient', 'admissionDate', 'actions'];

ngOnInit(): void {
  const user = this.authService.getCurrentUser();
  const role = user?.role; // Doctor | Nurse | Reception | Admin

  // ✅ Active IP Patients → ALL roles
  if (role && ['Doctor', 'Nurse', 'Reception', 'Admin'].includes(role)) {
    this.loadActivePatients();
  }

  // ✅ Bed Status → ALL roles
  if (role && ['Doctor', 'Nurse', 'Reception', 'Admin'].includes(role)) {
    this.loadAllBeds();
  }

  // ✅ IP Recommendations → ONLY Reception & Admin
  if (role && ['Reception', 'Admin', 'Nurse'].includes(role)) {
    this.loadRecommendedPatients();
  }
}

// Add these methods
selectPatientForBilling(patient: any): void {
  this.selectedPatient = patient;
  this.loadBillItems(patient._id);
  this.calculateBillSummary(patient._id);
}
calculateStayDays(admissionDate: string): number {
  if (!admissionDate) return 1;
  
  const admission = new Date(admissionDate);
  const today = new Date();
  const diffTime = today.getTime() - admission.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}
addBillItem(patient: any): void {
  const dialogRef = this.dialog.open(AddIpMedicineDialogComponent, {
    width: '900px',
    data: { 
      patient: patient.patient,
      visitId: patient._id,
      isIP: true,
      bedInfo: `${patient.bedAllocated?.room?.roomNumber} - Bed ${patient.bedAllocated?.bedNumber}`
    }
  });
  
  dialogRef.afterClosed().subscribe(result => {
    if (result?.success) {
      this.loadBillItems(patient._id);
      this.snackBar.open('Bill items added successfully', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  });
}
loadBillItems(visitId: string): void {
  this.medicineService.getIPBillItems(visitId).subscribe({
    next: (response: any) => {
      if (response.success) {
        this.billItems = response.data || [];
        this.calculateBillSummary(visitId);
      }
    },
    error: (err: any) => {
      console.error('Error loading bill items:', err);
      this.billItems = [];
      // Show user-friendly error
      if (err.status === 403) {
        this.snackBar.open('Access denied. Please check your permissions.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    }
  });
}
calculateBillSummary(visitId: string): void {
  // Load visit details
  this.visitService.getVisitById(visitId).subscribe({
    next: (visitResponse: any) => {
      const visit = visitResponse.data || visitResponse;
      
      // Calculate stay days
      if (visit.admissionDate) {
        const admissionDate = new Date(visit.admissionDate);
        const today = new Date();
        this.stayDays = Math.max(1, Math.ceil((today.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)));
        this.roomCharges = this.stayDays * (visit.bedAllocated?.room?.chargesPerDay || 500);
      }
      
      // Calculate doctor fees (consultation fee from prescription)
      this.prescriptionService.getPrescriptionByVisit(visitId).subscribe({
        next: (prescriptionRes: any) => {
          const prescription = prescriptionRes.data || prescriptionRes;
          this.doctorFees = prescription.billing?.consultationFee || 500;
        }
      });
      
      // Calculate nursing charges (₹100 per day)
      this.nursingCharges = this.stayDays * 100;
      
      // Update itemized charges
      this.calculateItemizedCharges();
      
      this.lastUpdated = new Date();
    }
  });
}
calculatePaymentStatus(): void {
  const billedItems = this.billItems.filter(item => item.isBilled);
  const totalBilled = billedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  
  // For simplicity, assume billed items are paid
  this.paidAmount = totalBilled;
  this.pendingAmount = this.calculateGrandTotal() - this.paidAmount;
  this.balanceAmount = this.pendingAmount;
  
  if (this.paidAmount <= 0) {
    this.paymentStatus = 'PENDING';
  } else if (this.paidAmount >= this.calculateGrandTotal()) {
    this.paymentStatus = 'PAID';
  } else {
    this.paymentStatus = 'PARTIAL';
  }
}
generateFinalBill(patient: any): void {
  if (this.billItems.length === 0) {
    this.snackBar.open('No bill items to generate final bill', 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
    return;
  }

  const dialogRef = this.dialog.open(FinalBillDialogComponent, {
    width: '800px',
    data: {
      patient: patient,
      billItems: this.billItems,
      roomCharges: this.roomCharges,
      doctorFees: this.doctorFees,
      nursingCharges: this.nursingCharges,
      stayDays: this.stayDays,
      subtotal: this.calculateSubtotal(),
      tax: this.calculateTax(),
      total: this.calculateGrandTotal()
    }
  });
  
  dialogRef.afterClosed().subscribe(result => {
    if (result?.success) {
      this.markItemsAsBilled(patient._id, result.paymentData);
    }
  });
}

markItemsAsBilled(visitId: string, paymentData: any): void {
  this.medicineService.markBillItemsAsBilled(visitId, paymentData).subscribe({
    next: (response: any) => {
      if (response.success) {
        // Refresh bill items
        this.loadBillItems(visitId);
        
        this.snackBar.open('Final bill generated successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    },
    error: (err) => {
      console.error('Error generating bill:', err);
      this.snackBar.open('Failed to generate final bill', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  });
}
calculateItemizedCharges(): void {
  const categories: { [key: string]: { name: string; amount: number } } = {};
  
  this.billItems.forEach(item => {
    const category = item.categoryType || 'OTHER';
    if (!categories[category]) {
      categories[category] = {
        name: category,
        amount: 0
      };
    }
    categories[category].amount += item.totalPrice || 0;
  });
  
  this.itemizedCharges = Object.values(categories);
}
// Calculate subtotal
calculateSubtotal(): number {
  const itemTotal = this.billItems.reduce((sum: number, item: any) => 
    sum + (item.totalPrice || 0), 0
  );
  return itemTotal + this.roomCharges + this.doctorFees + this.nursingCharges;
}
calculateTax(): number {
  return this.calculateSubtotal() * 0.18; // 18% GST
}
// Calculate grand total
calculateGrandTotal(): number {
  return this.calculateSubtotal() + this.calculateTax();
}
// Delete bill item
deleteBillItem(item: any): void {
  if (confirm('Are you sure you want to delete this bill item?')) {
    this.medicineService.deleteBillItem(item._id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.billItems = this.billItems.filter(billItem => billItem._id !== item._id);
          this.snackBar.open('Bill item deleted', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error('Error deleting bill item:', err);
        this.snackBar.open('Failed to delete bill item', 'Close', { duration: 3000 });
      }
    });
  }
}

private loadActivePatients(): void {
  this.ipAdmissionService.getCurrentIPPatients().subscribe({
    next: (response: any) => {
      this.activePatients = response.data || [];

      this.activePatients.forEach((patient: any) => {
        if (patient.admissionDate) {
          const admissionDate = new Date(patient.admissionDate);
          const today = new Date();
          patient.stayDays = Math.ceil(
            (today.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          patient.roomCharges =
            patient.stayDays * (patient.bedAllocated?.room?.chargesPerDay || 0);
        }
      });
    },
    error: (err) => {
      console.error('Error loading active patients:', err);
    }
  });
}
addManualCharge(patient: any): void {
  const dialogRef = this.dialog.open(ManualChargeDialogComponent, {
    width: '500px',
    data: {
      patient: patient.patient,
      visitId: patient._id,
      user: this.authService.getCurrentUser()
    }
  });
  
  dialogRef.afterClosed().subscribe(result => {
    if (result?.success) {
      this.addManualBillItem(patient._id, result.data);
    }
  });
}
addManualBillItem(visitId: string, chargeData: any): void {
  const manualItem = {
    visit: visitId,
    patient: this.selectedPatient.patient._id,
    name: chargeData.description,
    categoryType: chargeData.category || 'MANUAL',
    quantity: 1,
    unitPrice: chargeData.amount,
    totalPrice: chargeData.amount,
    instructions: chargeData.notes,
    addedBy: {
      id: chargeData.user.id,
      name: chargeData.user.name,
      role: chargeData.user.role
    },
    isManual: true,
    createdAt: new Date()
  };
  
  this.medicineService.addManualBillItem(manualItem).subscribe({
    next: (response: any) => {
      if (response.success) {
        this.billItems.unshift(response.data);
        this.calculateItemizedCharges();
        this.snackBar.open('Manual charge added successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    },
    error: (err) => {
      console.error('Error adding manual charge:', err);
      this.snackBar.open('Failed to add manual charge', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  });
}

allocateBed(recommendation: any) {
  this.router.navigate(
    ['/reception/ip-admission'],
    {
      queryParams: {
        visitId: recommendation.visitId,
        source: 'RECOMMENDATION'
      }
    }
  );
}
editBillItem(item: any): void {
  const dialogRef = this.dialog.open(EditBillItemDialogComponent, {
    width: '600px',
    data: { item, user: this.authService.getCurrentUser() }
  });
  
  dialogRef.afterClosed().subscribe(result => {
    if (result?.success) {
      this.medicineService.updateBillItem(item._id, result.data).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.loadBillItems(this.selectedPatient._id);
            this.snackBar.open('Bill item updated successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          }
        },
        error: (err) => {
          console.error('Error updating bill item:', err);
          this.snackBar.open('Failed to update bill item', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  });
}
   private loadAllBeds(): void {
    this.bedService.getAllBeds().subscribe({
      next: (res) => {
        this.allBeds = Array.isArray(res.data) ? res.data : [];
        this.calculateBedStats();
      },
      error: () => {
        this.snackBar.open('Failed to load beds', 'Close', { duration: 3000 });
      }
    });
  }
private loadRecommendedPatients(): void {
  console.log('🟢 Loading IP recommendations...');

  this.ipAdmissionService.getRecommendedIPPatients().subscribe({
    next: (res: any) => {
      console.log('✅ API Response:', res);
      this.recommendedPatients = res.data || [];
      console.log('📊 Patients count:', this.recommendedPatients.length);
      
      // Also load active IP patients for the billing tab
      this.loadActivePatients();
    },
    error: (err) => {
      console.error('❌ API Error:', err);
      this.recommendedPatients = [];
    }
  });
}



 private calculateBedStats(): void {
    this.bedStats.total = this.allBeds.length;
    this.bedStats.available = this.allBeds.filter(b => b.status === 'AVAILABLE').length;
    this.bedStats.occupied = this.allBeds.filter(b => b.status === 'OCCUPIED').length;
    this.bedStats.maintenance = this.allBeds.filter(b =>
      b.status === 'MAINTENANCE' || b.status === 'CLEANING'
    ).length;
  }

  getBedColor(status: string): string {
    switch(status) {
      case 'AVAILABLE': return '#4CAF50';
      case 'OCCUPIED': return '#F44336';
      case 'MAINTENANCE': return '#FF9800';
      case 'CLEANING': return '#2196F3';
      default: return '#757575';
    }
  }

  getStatusColor(status: string): any {
    switch(status) {
      case 'AVAILABLE': return 'primary';
      case 'OCCUPIED': return 'warn';
      case 'MAINTENANCE': return 'accent';
      default: return undefined;
    }
  }

 addMedicine(patient: any): void {
    this.addBillItem(patient); // Use the same method for consistency


}
  dischargePatient(patient: any): void {
    const dialogRef = this.dialog.open(DischargeDialogComponent, {
      width: '600px',
      data: { 
        patient: patient.patient,
        visit: patient,
        bed: patient.bedAllocated 
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open('Patient discharged successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadActivePatients();
        this.loadAllBeds();
      }
    });
  }

  dischargeFromBed(bed: any): void {
    if (!bed || bed.status !== 'OCCUPIED') return;

    this.bedService.dischargeBed(bed._id).subscribe({
      next: () => {
        this.snackBar.open('Patient discharged successfully', 'Close', {
          duration: 3000
        });
        this.loadAllBeds();
      },
      error: () => {
        this.snackBar.open('Discharge failed', 'Close', {
          duration: 3000
        });
      }
    });
  }
// In ip-dashboard.component.ts - Update the admitPatient method
admitPatient(recommendedPatient: any): void {
  this.router.navigate(
    ['/reception/ip-admission'],
    {
      queryParams: {
        visitId: recommendedPatient.visitId,
        source: 'RECOMMENDATION'
      }
    }
  );
}




  viewVitals(patient: any): void {
    // Navigate to vitals page or open dialog
    console.log('View vitals for:', patient);
  }
}