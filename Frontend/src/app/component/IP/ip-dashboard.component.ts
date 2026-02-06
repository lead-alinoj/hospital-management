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
import { PaymentSummaryComponent } from "./ip-pharmacy-bill/payment-summary.component";
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
    MatTooltipModule,
    PaymentSummaryComponent
],
  template: `
    <div class="ip-dashboard">
      <h1>In-Patient Management</h1>
      
      <mat-tab-group>
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
            <!-- <p><strong>Current Bill:</strong> ₹{{ patient.currentBillAmount || 0 | number:'1.2-2' }}</p> -->
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
        <h3>{{ selectedPatient.patient?.fullName }}</h3>
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
       <!-- In ip-dashboard.component.html - Update the bill summary section -->
<!-- Bill Summary -->
<div class="bill-summary-card">
  <div class="summary-header">
    <h4>Bill Summary</h4>
    <span class="last-updated">Updated: {{ lastUpdated | date:'medium' }}</span>
  </div>
  
  <div class="summary-grid">
    <!-- Itemized Charges ONLY -->
    <div class="summary-section">
      <h5>All Charges</h5>
      <div *ngIf="itemizedCharges.length > 0; else noCharges">
        <div class="summary-item" *ngFor="let category of itemizedCharges">
          <span>{{ category.name }}</span>
          <span>₹{{ category.amount | number:'1.2-2' }}</span>
        </div>
      </div>
      <ng-template #noCharges>
        <div class="no-charges-message">
          <mat-icon>receipt</mat-icon>
          <p>No charges added yet</p>
        </div>
      </ng-template>
    </div>
    
    <!-- Total Section -->
    <div class="summary-section total-section">
      <div class="summary-item">
        <span>Subtotal:</span>
        <span>₹{{ calculateSubtotal() | number:'1.2-2' }}</span>
      </div>
      <!-- <div class="summary-item">
        <span>Tax (GST 18%):</span>
        <span>₹{{ calculateTax() | number:'1.2-2' }}</span>
      </div> -->
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
      <div class="payment-summary-section" *ngIf="selectedPatient">
        <app-payment-summary
          [visitId]="selectedPatient._id"
          [patientId]="selectedPatient.patient?._id"
          [totalBillAmount]="calculateGrandTotal()"
          (paymentAdded)="loadBillItems(selectedPatient._id)">
        </app-payment-summary>
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
                      <!-- <button mat-button color="accent" (click)="viewVitals(patient)">
                        <mat-icon>monitor_heart</mat-icon> Vitals
                      </button>
                      <button mat-button color="warn" (click)="dischargePatient(patient)">
                        <mat-icon>logout</mat-icon> Discharge
                      </button> -->
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
    /* Medical Hospital Dashboard - Modern Calm Theme */
.ip-dashboard {
  padding: 24px;
  background: linear-gradient(135deg, #f8fdff 0%, #f0f9ff 100%);
  min-height: 100vh;
  
  h1 {
    color: #1a73e8;
    font-size: 2.2rem;
    font-weight: 500;
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e3f2fd;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 80px;
      height: 3px;
      background: linear-gradient(90deg, #1a73e8, #00bcd4);
      border-radius: 2px;
    }
  }
}

/* Tab Group Styling */
::ng-deep .mat-mdc-tab-group {
  background: transparent;
  border-radius: 16px;
  
  .mat-mdc-tab-header {
    background: white;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 2px 12px rgba(26, 115, 232, 0.08);
    margin-bottom: 24px;
    
    .mat-mdc-tab-label-container {
      padding: 0 24px;
    }
    
    .mdc-tab {
      min-width: 160px;
      padding: 0 24px;
      height: 56px;
      
      .mdc-tab__text-label {
        color: #5f6368;
        font-weight: 500;
        font-size: 14px;
        letter-spacing: 0.25px;
      }
      
      .mat-mdc-tab-ripple {
        border-radius: 12px 12px 0 0;
      }
    }
    
    .mdc-tab-indicator__content--underline {
      border-radius: 2px;
      height: 3px;
    }
    
    .mat-mdc-tab.mdc-tab--active {
      .mdc-tab__text-label {
        color: #1a73e8;
        font-weight: 600;
      }
    }
  }
  
  .mat-mdc-tab-body-wrapper {
    background: transparent;
    min-height: 600px;
  }
}

.tab-content {
  padding: 24px 0;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Patient Selection Grid */
.patient-selection {
  padding: 32px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 32px;
  
  h3 {
    color: #2c3e50;
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    gap: 12px;
    
    &::before {
      content: '👤';
      font-size: 1.8rem;
    }
  }
}

.patient-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.patient-billing-card {
  border-radius: 16px;
  border: 1px solid #e8f4fd;
  background: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #1a73e8, #00bcd4);
  }
  
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(26, 115, 232, 0.15);
    border-color: #1a73e8;
    
    .mat-mdc-card-header {
      .mat-mdc-card-title {
        color: #1a73e8;
      }
    }
  }
  
  .mat-mdc-card-header {
    padding: 20px 20px 12px 24px;
    
    .mat-mdc-card-title {
      color: #2c3e50;
      font-size: 1.3rem;
      font-weight: 500;
      margin-bottom: 4px;
      transition: color 0.3s ease;
    }
    
    .mat-mdc-card-subtitle {
      color: #5f6368;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      
      &::before {
        content: '🆔';
        font-size: 14px;
      }
    }
  }
  
  .mat-mdc-card-content {
    padding: 0 24px 20px;
    
    p {
      margin: 8px 0;
      color: #5f6368;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      
      strong {
        color: #2c3e50;
        font-weight: 500;
        min-width: 120px;
      }
    }
    
    p:last-child {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px dashed #e8f4fd;
      color: #1a73e8;
      font-weight: 600;
      font-size: 15px;
      
      strong {
        color: #1a73e8;
      }
    }
  }
}

/* Billing Section */
.billing-section {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f0f7ff;
  
  button[mat-button] {
    color: #5f6368;
    font-weight: 500;
    border-radius: 12px;
    padding: 8px 20px;
    transition: all 0.3s ease;
    
    &:hover {
      background: #f0f7ff;
      color: #1a73e8;
    }
    
    mat-icon {
      margin-right: 8px;
      font-size: 20px;
      height: 20px;
      width: 20px;
    }
  }
  
  h3 {
    color: #2c3e50;
    font-size: 1.6rem;
    font-weight: 500;
    margin: 0;
    flex: 1;
    text-align: center;
  }
}

.bill-actions {
  display: flex;
  gap: 12px;
  
  button {
    border-radius: 12px;
    padding: 10px 24px;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0.3px;
    transition: all 0.3s ease;
    
    mat-icon {
      margin-right: 8px;
      font-size: 20px;
    }
    
    &[color="primary"] {
      background: linear-gradient(135deg, #1a73e8, #4285f4);
      box-shadow: 0 4px 12px rgba(26, 115, 232, 0.25);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(26, 115, 232, 0.35);
      }
    }
    
    &[color="accent"] {
      background: linear-gradient(135deg, #00bcd4, #26c6da);
      box-shadow: 0 4px 12px rgba(0, 188, 212, 0.25);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 188, 212, 0.35);
      }
    }
    
    &[color="warn"] {
      background: linear-gradient(135deg, #ef5350, #f44336);
      box-shadow: 0 4px 12px rgba(239, 83, 80, 0.25);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(239, 83, 80, 0.35);
      }
      
      &:disabled {
        background: #e0e0e0;
        box-shadow: none;
        color: #9e9e9e;
      }
    }
  }
}

/* Bill Items Table */
.bill-items-section {
  margin-top: 32px;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 32px;
  border-radius: 16px;
  border: 1px solid #e8f4fd;
  background: white;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
  
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    
    th {
      background: #f8fdff;
      color: #2c3e50;
      font-weight: 600;
      font-size: 14px;
      padding: 18px 16px;
      border-bottom: 2px solid #e8f4fd;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 16px;
      border-bottom: 1px solid #f0f7ff;
      color: #126cdb;
      font-size: 14px;
    }
    
    tbody tr {
      transition: all 0.2s ease;
      
      &:hover {
        background: #f8fdff;
        td {
          color: #2c3e50;
        }
      }
      
      &:last-child td {
        border-bottom: none;
      }
    }
  }
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  strong {
    color: #2c3e50;
    font-weight: 500;
  }
}

.category-badge {
  background: #e3f2fd;
  color: #1a73e8;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
  width: fit-content;
  letter-spacing: 0.3px;
}

.instructions {
  font-size: 12px;
  color: #78909c;
  font-style: italic;
  line-height: 1.4;
  background: #f9f9f9;
  padding: 6px 10px;
  border-radius: 8px;
  border-left: 3px solid #e0e0e0;
}

.days-info {
  font-size: 12px;
  color: #00bcd4;
  font-weight: 500;
  background: #e0f7fa;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
  margin-top: 4px;
}

.added-by {
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  span {
    color: #2c3e50;
    font-weight: 500;
  }
  
  small {
    font-size: 11px;
    color: #78909c;
  }
}

/* Status Chips */
::ng-deep .mat-mdc-chip {
  font-weight: 500 !important;
  font-size: 12px !important;
  letter-spacing: 0.3px !important;
  border-radius: 12px !important;
  min-height: 24px !important;
  padding: 2px 12px !important;
  
  &.mat-mdc-chip-selected {
    &.mat-primary {
      background: linear-gradient(135deg, #1a73e8, #4285f4) !important;
      color: white !important;
    }
    
    &.mat-accent {
      background: linear-gradient(135deg, #00bcd4, #26c6da) !important;
      color: white !important;
    }
    
    &.mat-warn {
      background: linear-gradient(135deg, #ef5350, #f44336) !important;
      color: white !important;
    }
  }
}

/* Bill Summary Card */
.bill-summary-card {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8f4fd;
  margin-top: 32px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f7ff;
  
  h4 {
    color: #2c3e50;
    font-size: 1.4rem;
    font-weight: 500;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    
    &::before {
      content: '📊';
      font-size: 1.6rem;
    }
  }
}

.last-updated {
  font-size: 12px;
  color: #78909c;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  margin-bottom: 24px;
}

.summary-section {
  padding: 20px;
  background: #f8fdff;
  border-radius: 12px;
  border: 1px solid #e8f4fd;
  
  h5 {
    margin: 0 0 20px 0;
    color: #1a73e8;
    font-weight: 600;
    font-size: 1.1rem;
    padding-bottom: 12px;
    border-bottom: 1px solid #e0f2ff;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &::before {
      content: '💊';
      font-size: 1.2rem;
    }
  }
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f7ff;
  font-size: 14px;
  
  &:last-child {
    border-bottom: none;
  }
  
  span {
    color: #5f6368;
    
    &:first-child {
      color: #2c3e50;
      font-weight: 500;
    }
  }
}

.total-section {
  background: linear-gradient(135deg, #f0f7ff, #e8f4fd);
  border: 2px solid #1a73e8;
  
  h5 {
    color: #1a73e8;
    
    &::before {
      content: '💰';
    }
  }
  
  .summary-item {
    border-bottom-color: rgba(26, 115, 232, 0.2);
  }
  
  .grand-total {
    font-size: 1.2em;
    color: #1a73e8;
    margin-top: 12px;
    padding-top: 16px;
    border-top: 2px solid rgba(26, 115, 232, 0.3);
    
    strong {
      font-weight: 600;
    }
  }
}

/* Payment Status */
.payment-status {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #f0f7ff;
  
  ::ng-deep .mat-mdc-chip-set {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}

/* No Bill Items State */
.no-bill-items {
  text-align: center;
  padding: 60px 32px;
  background: linear-gradient(135deg, #f8fdff, #f0f9ff);
  border-radius: 16px;
  border: 2px dashed #c2e7ff;
  margin-top: 32px;
  
  mat-icon {
    font-size: 64px;
    height: 64px;
    width: 64px;
    margin-bottom: 20px;
    color: #90caf9;
  }
  
  p {
    color: #5f6368;
    font-size: 1.2rem;
    margin-bottom: 8px;
  }
}

.empty-subtext {
  color: #78909c !important;
  font-size: 14px !important;
  margin-bottom: 32px !important;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  
  button {
    border-radius: 12px;
    padding: 12px 28px;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0.3px;
    transition: all 0.3s ease;
    
    mat-icon {
      margin-right: 10px;
      font-size: 20px;
    }
    
    &[color="primary"] {
      background: linear-gradient(135deg, #1a73e8, #4285f4);
      box-shadow: 0 4px 12px rgba(26, 115, 232, 0.25);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(26, 115, 232, 0.35);
      }
    }
    
    &[color="accent"] {
      background: linear-gradient(135deg, #00bcd4, #26c6da);
      box-shadow: 0 4px 12px rgba(0, 188, 212, 0.25);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 188, 212, 0.35);
      }
    }
  }
}

/* Payment Summary Section */
.payment-summary-section {
  margin-top: 40px;
  padding: 28px;
  background: white;
  border-radius: 16px;
  border: 1px solid #e8f4fd;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

/* Cards Grid */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.patient-card {
  border-radius: 16px;
  border: 1px solid #e8f4fd;
  background: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #00bcd4, #4caf50);
  }
  
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0, 188, 212, 0.15);
    border-color: #00bcd4;
  }
  
  .mat-mdc-card-header {
    padding: 20px 20px 12px 24px;
    
    .mat-mdc-card-title {
      color: #2c3e50;
      font-size: 1.3rem;
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .mat-mdc-card-subtitle {
      color: #5f6368;
      font-size: 13px;
    }
  }
  
  .mat-mdc-card-content {
    padding: 0 24px 20px;
    
    p {
      margin: 8px 0;
      color: #5f6368;
      font-size: 14px;
      
      b {
        color: #2c3e50;
        font-weight: 500;
        min-width: 120px;
        display: inline-block;
      }
    }
  }
}

/* Vitals & Medicine Boxes */
.vitals-box {
  background: #e8f5e9;
  padding: 10px 16px;
  border-radius: 10px;
  margin: 12px 0;
  font-size: 13px;
  color: #2e7d32;
  border-left: 4px solid #4caf50;
  
  b {
    color: #2e7d32;
    font-weight: 600;
    margin-right: 8px;
  }
  
  span {
    margin-right: 12px;
    
    &:last-child {
      margin-right: 0;
    }
  }
}

.medicine-box {
  background: #f0f7ff;
  padding: 12px;
  border-radius: 10px;
  margin: 12px 0;
  border: 1px solid #e8f4fd;
  
  h4 {
    color: #1a73e8;
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 10px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &::before {
      content: '💊';
      font-size: 16px;
    }
  }
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  
  tr {
    border-bottom: 1px solid #e8f4fd;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  td {
    padding: 6px 8px;
    color: #5f6368;
    
    &:first-child {
      color: #2c3e50;
      font-weight: 500;
    }
  }
}

.no-medicines {
  color: #78909c;
  font-style: italic;
  margin: 10px 0;
  font-size: 13px;
  text-align: center;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 8px;
}

/* Card Actions */
.mat-mdc-card-actions {
  padding: 16px 24px 20px !important;
  display: flex;
  gap: 12px;
  
  button {
    border-radius: 10px;
    padding: 8px 20px;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0.3px;
    
    &[color="primary"] {
      background: linear-gradient(135deg, #1a73e8, #4285f4);
      box-shadow: 0 2px 8px rgba(26, 115, 232, 0.25);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(26, 115, 232, 0.35);
      }
      
      &:disabled {
        background: #e0e0e0;
        box-shadow: none;
        color: #9e9e9e;
      }
    }
  }
}

/* No Data States */
.no-data {
  text-align: center;
  padding: 80px 32px;
  background: linear-gradient(135deg, #f8fdff, #f0f9ff);
  border-radius: 16px;
  border: 2px dashed #c2e7ff;
  margin-top: 32px;
  
  mat-icon {
    font-size: 72px;
    margin-bottom: 24px;
    color: #90caf9;
    opacity: 0.7;
  }
  
  p {
    color: #5f6368;
    font-size: 1.3rem;
    margin-bottom: 12px;
    font-weight: 500;
  }
  
  small {
    color: #78909c;
    font-size: 14px;
    line-height: 1.5;
  }
}

/* Stats Section */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  text-align: center;
  padding: 24px 20px;
  border-radius: 16px;
  background: white;
  border: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #e0e0e0, #f5f5f5);
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
  
h3 {
  color: #1a73e8;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
  text-align: center;
  font-family: 'Roboto', sans-serif;
  border-bottom: 2px solid #e8f4fd;
  padding-bottom: 10px;
  margin-bottom: -12px;
  display: inline-block;
}
  
  .stat-number {
    font-size: 2rem;
    font-weight: 300;
    margin: 0;
    color: #2c3e50;
    font-family: 'Roboto Mono', monospace;
  }

  
  &.available::before {
    background: linear-gradient(90deg, #4caf50, #66bb6a);
  }
  
  &.occupied::before {
    background: linear-gradient(90deg, #ef5350, #f44336);
  }
  
  &.maintenance::before {
    background: linear-gradient(90deg, #ffb300, #ffca28);
  }
}

/* Beds List */
.beds-list {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8f4fd;
  
  h3 {
    color: #2c3e50;
    font-size: 1.3rem;
    font-weight: 500;
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    
    &::before {
      content: '🛏️';
      font-size: 1.5rem;
    }
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .ip-dashboard {
    padding: 16px;
    
    h1 {
      font-size: 1.8rem;
      margin-bottom: 24px;
    }
  }
  
  ::ng-deep .mat-mdc-tab-group {
    .mdc-tab {
      min-width: 120px;
      padding: 0 16px;
    }
  }
  
  .patient-grid,
  .cards-grid {
    grid-template-columns: 1fr;
  }
  
  .bill-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
    
    h3 {
      order: -1;
      margin-bottom: 8px;
    }
  }
  
  .bill-actions {
    flex-wrap: wrap;
    justify-content: center;
    
    button {
      width: 100%;
      justify-content: center;
    }
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
    
    button {
      width: 100%;
      justify-content: center;
    }
  }
  
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .table-container {
    font-size: 12px;
    
    th, td {
      padding: 12px 8px;
    }
  }
}

@media (max-width: 480px) {
  .stats {
    grid-template-columns: 1fr;
  }
  
  .patient-billing-card,
  .patient-card {
    margin: 0;
  }
  
  .bill-summary-card,
  .payment-summary-section {
    padding: 20px;
  }
}

/* Loading Animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.loading {
  animation: pulse 1.5s ease-in-out infinite;
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #1a73e8, #00bcd4);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #1565c0, #0097a7);
}

/* Print Styles */
@media print {
  .bill-actions,
  .mat-mdc-card-actions,
  button {
    display: none !important;
  }
  
  .bill-summary-card,
  .table-container {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }
}
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
  if (role && ['Doctor', 'Nurse', 'Reception', 'Admin', 'Pharmacy'].includes(role)) {
    this.loadActivePatients();
  }

  // ✅ Bed Status → ALL roles
  if (role && ['Doctor', 'Nurse', 'Reception', 'Admin', 'Pharmacy'].includes(role)) {
    this.loadAllBeds();
  }

  // ✅ IP Recommendations → ONLY Reception & Admin
  if (role && ['Reception', 'Admin', 'Nurse', 'Pharmacy'].includes(role)) {
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
      
      // Calculate stay days only (for display purposes)
      if (visit.admissionDate) {
        const admissionDate = new Date(visit.admissionDate);
        const today = new Date();
        this.stayDays = Math.max(1, Math.ceil((today.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)));
        
        // NO automatic room charges calculation
        // User must add room charges manually if needed
        this.roomCharges = 0;
      }
      
      // NO automatic doctor fees calculation
      this.doctorFees = 0;
      
      // NO automatic nursing charges calculation
      this.nursingCharges = 0;
      
      // Update itemized charges (only from manual items)
      this.calculateItemizedCharges();
      
      // Calculate payment status
      this.calculatePaymentStatus();
      
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
// Update generateFinalBill method
generateFinalBill(patient: any): void {
  if (this.billItems.length === 0) {
    this.snackBar.open('No charges added to generate bill', 'Close', {
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
      subtotal: this.calculateSubtotal(),
      total: this.calculateGrandTotal(),
      stayDays: this.calculateStayDays(patient.admissionDate)
    }
  });
  
  dialogRef.afterClosed().subscribe(result => {
    if (result?.success) {
      this.markItemsAsBilled(patient._id, result.paymentData);
    }
  });
}

markItemsAsBilled(visitId: string, paymentData: any): void {
  // Add missing required fields
  const completePaymentData = {
    ...paymentData,
    patientId: this.selectedPatient.patient._id,
    totalAmount: this.calculateGrandTotal()
  };

  this.medicineService.markBillItemsAsBilled(visitId, completePaymentData).subscribe({
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
      this.snackBar.open('Failed to generate final bill: ' + err.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  });
}
calculateGrandTotal(): number {
  return this.calculateSubtotal(); // No GST
}
calculateItemizedCharges(): void {
  const categories: { [key: string]: { name: string; amount: number } } = {};
  
  // Add ONLY bill items (including any manual charges for room/doctor/nursing)
  this.billItems.forEach(item => {
    const category = item.categoryType || 'OTHER';
    const displayName = this.getCategoryDisplayName(category);
    
    if (!categories[category]) {
      categories[category] = {
        name: displayName,
        amount: 0
      };
    }
    categories[category].amount += item.totalPrice || 0;
  });
  
  this.itemizedCharges = Object.values(categories);
}
getCategoryDisplayName(category: string): string {
  const displayNames: {[key: string]: string} = {
    'ROOM': 'Room Charges',
    'DOCTOR': 'Doctor Consultation',
    'NURSING': 'Nursing Care',
    'MEDICINE': 'Medicines',
    'CONSUMABLE': 'Consumables',
    'PROCEDURE': 'Procedures',
    'LAB': 'Lab Tests',
    'CONSULTATION': 'Consultations',
    'MANUAL': 'Manual Charges',
    'OTHER': 'Other Charges'
  };
  return displayNames[category] || category;
}
// Calculate subtotal
calculateSubtotal(): number {
  return this.billItems.reduce((sum: number, item: any) => 
    sum + (item.totalPrice || 0), 0
  );
}
calculateTax(): number {
  return this.calculateSubtotal() * 0.18; // 18% GST
}
// Calculate grand total
// calculateGrandTotal(): number {
//   return this.calculateSubtotal() + this.calculateTax();
// }
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
// Update addManualBillItem method
addManualBillItem(visitId: string, chargeData: any): void {
  // Map category to proper categoryType
  const categoryMap: {[key: string]: string} = {
    'CONSULTATION': 'DOCTOR',
    'PROCEDURE': 'PROCEDURE',
    'LAB': 'LAB',
    'NURSING': 'NURSING',
    'OTHER': 'OTHER'
  };
  
  const categoryType = categoryMap[chargeData.category] || chargeData.category;
  
  const manualItem = {
    visit: visitId,
    patient: this.selectedPatient.patient._id,
    name: chargeData.description,
    categoryType: categoryType,
    quantity: 1,
    unitPrice: chargeData.amount,
    totalPrice: chargeData.amount,
    instructions: chargeData.notes || '',
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
        // Add to beginning of array and refresh
        this.billItems.unshift(response.data);
        this.calculateItemizedCharges();
        this.snackBar.open('Charge added successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    },
    error: (err) => {
      console.error('Error adding manual charge:', err);
      this.snackBar.open('Failed to add charge: ' + err.message, 'Close', {
        duration: 5000,
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