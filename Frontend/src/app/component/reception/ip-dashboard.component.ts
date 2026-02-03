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
import { DischargeDialogComponent } from './discharge-dialog.component';
import { AddIpMedicineDialogComponent} from './add-ip-medicine-dialog.component';
import { Router } from '@angular/router';
import { IpAdmissionService } from '../../service/ip-admission.service';
import { IpRecommendationDialogComponent } from '../doctor/ip-recommendation-dialog.component';
import { AuthService } from '../../auth/auth.service';
import { MedicineService } from '../../service/medicine.service';
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
        // In the template, add a new tab
<mat-tab label="IP Billing">
  <div class="tab-content">
    <div class="bill-header">
      <h3>IP Bill Items for {{ selectedPatient?.fullName }}</h3>
      <button mat-raised-button color="primary" (click)="addBillItem(selectedPatient)">
        <mat-icon>add</mat-icon> Add Bill Item
      </button>
    </div>
    
    <!-- Bill Items Table -->
    <div class="bill-items-section" *ngIf="billItems.length > 0">
      <table mat-table [dataSource]="billItems" class="mat-elevation-z1">
        <!-- Date Column -->
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let item">
            {{ item.createdAt | date:'short' }}
          </td>
        </ng-container>
        
        <!-- Item Name Column -->
        <ng-container matColumnDef="item">
          <th mat-header-cell *matHeaderCellDef>Item</th>
          <td mat-cell *matCellDef="let item">
            <div>
              <strong>{{ item.name }}</strong>
              <small *ngIf="item.categoryType">({{ item.categoryType }})</small>
            </div>
          </td>
        </ng-container>
        
        <!-- Qty Column -->
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
        
        <!-- Administered By Column -->
        <ng-container matColumnDef="administeredBy">
          <th mat-header-cell *matHeaderCellDef>By</th>
          <td mat-cell *matCellDef="let item">
            {{ item.administeredBy }}
          </td>
        </ng-container>
        
        <!-- Actions Column -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let item">
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
      
      <!-- Bill Summary -->
      <div class="bill-summary">
        <div class="summary-item">
          <span>Subtotal:</span>
          <span>₹{{ calculateSubtotal() | number:'1.2-2' }}</span>
        </div>
        <div class="summary-item">
          <span>Room Charges ({{ stayDays }} days):</span>
          <span>₹{{ roomCharges | number:'1.2-2' }}</span>
        </div>
        <div class="summary-item">
          <span>Doctor Fees:</span>
          <span>₹{{ doctorFees | number:'1.2-2' }}</span>
        </div>
        <div class="summary-item total">
          <strong>Grand Total:</strong>
          <strong>₹{{ calculateGrandTotal() | number:'1.2-2' }}</strong>
        </div>
      </div>
    </div>
    
    <div *ngIf="billItems.length === 0" class="no-bill-items">
      <mat-icon>receipt</mat-icon>
      <p>No bill items added yet</p>
      <button mat-raised-button color="primary" (click)="addBillItem(selectedPatient)">
        Add First Bill Item
      </button>
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

   selectedPatient: any = null;
  billItems: any[] = [];
  billColumns = ['date', 'item', 'qty', 'unitPrice', 'total', 'administeredBy', 'actions'];
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
  addBillItem(patient: any): void {
    // Implement dialog to add bill items
    this.selectedPatient = patient;
    console.log('Add bill item for:', patient);
  }

  calculateSubtotal(): number {
    return this.billItems.reduce((sum: number, item: any) => 
      sum + (item.totalPrice || 0), 0
    );
  }

  calculateGrandTotal(): number {
    return this.calculateSubtotal() + this.roomCharges + this.doctorFees;
  }

  deleteBillItem(item: any): void {
    // Implement delete logic
    console.log('Delete bill item:', item);
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
// In ip-dashboard.component.ts - Update the loadRecommendedPatients method
private loadRecommendedPatients(): void {
  console.log('🟢 Loading IP recommendations...');

  this.ipAdmissionService.getRecommendedIPPatients().subscribe({
    next: (res: any) => {
      console.log('✅ API Response:', res);
      this.recommendedPatients = res.data || [];
      console.log('📊 Patients count:', this.recommendedPatients.length);
      
      // Debug: Log each patient's structure
      this.recommendedPatients.forEach((patient, index) => {
        console.log(`Patient ${index + 1}:`, {
          id: patient.visitId,
          name: patient.patient?.fullName,
          medicines: patient.medicines,
          diagnosis: patient.diagnosis,
          admissionType: patient.admissionType
        });
      });
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
  const dialogRef = this.dialog.open(AddIpMedicineDialogComponent, { // Use AddIpMedicineDialogComponent
    width: '800px',
    data: { 
      patient: patient.patient,
      visitId: patient._id,
      isIP: true,
      bedInfo: `${patient.bedAllocated?.room?.roomNumber} - Bed ${patient.bedAllocated?.bedNumber}`
    }
  });
  
  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.snackBar.open('Medicine added to IP patient', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  });
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