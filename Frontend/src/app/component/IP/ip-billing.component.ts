import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IpAdmissionService } from '../../service/ip-admission.service';
import { MedicineService } from '../../service/medicine.service';
import { PrescriptionService } from '../../service/prescription.service'; // ✅ Add this import

@Component({
  selector: 'app-ip-billing',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="ip-billing-container">
      <h2>IP Patient Billing</h2>
      
      <div class="patient-list">
        <mat-card *ngFor="let patient of ipPatients" class="patient-card">
          <mat-card-header>
            <mat-card-title>{{ patient.patient?.fullName }}</mat-card-title>
            <mat-card-subtitle>
              OP: {{ patient.patient?.opNumber }} | 
              Bed: {{ patient.bedAllocated?.bedNumber }}
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <p><strong>Admitted:</strong> {{ patient.admissionDate | date:'medium' }}</p>
            <p><strong>Doctor:</strong> Dr. {{ patient.doctor?.name }}</p>
            
            <!-- Medicines List -->
            <div *ngIf="patient.prescriptionId?.medicines?.length > 0" class="medicines-section">
              <h4>Medicines</h4>
              <table class="medicines-table">
                <tr *ngFor="let med of patient.prescriptionId.medicines">
                  <td>{{ med.medicineName || med.name }}</td>
                  <td>{{ med.quantity }} × {{ med.days }} days</td>
                  <td>₹{{ (med.unitPrice || 0) * (med.quantity || 1) }}</td>
                </tr>
              </table>
            </div>
            
            <!-- Billing Summary -->
            <div class="billing-summary">
              <h4>Billing Summary</h4>
              <div class="bill-item">
                <span>Room Charges ({{ calculateStayDays(patient.admissionDate) }} days):</span>
                <span>₹{{ calculateRoomCharges(patient) }}</span>
              </div>
              <div class="bill-item">
                <span>Medicines:</span>
                <span>₹{{ calculateMedicineTotal(patient) }}</span>
              </div>
              <div class="bill-item total">
                <strong>Total:</strong>
                <strong>₹{{ calculateTotalBill(patient) }}</strong>
              </div>
            </div>
          </mat-card-content>
          
          <mat-card-actions align="end">
            <button mat-raised-button color="primary" (click)="generateBill(patient)">
              <mat-icon>receipt</mat-icon> Generate Bill
            </button>
            <button mat-button color="accent" (click)="addAdditionalCharges(patient)">
              <mat-icon>add</mat-icon> Add Charges
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .ip-billing-container { padding: 20px; }
    .patient-list { display: flex; flex-direction: column; gap: 20px; }
    .patient-card { width: 100%; }
    .medicines-section { margin: 15px 0; }
    .medicines-table { width: 100%; border-collapse: collapse; }
    .medicines-table tr td { padding: 5px; border-bottom: 1px solid #eee; }
    .billing-summary { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
    .bill-item { display: flex; justify-content: space-between; margin: 8px 0; }
    .bill-item.total { border-top: 2px solid #333; padding-top: 10px; font-size: 1.1em; }
  `]
})
export class IpBillingComponent implements OnInit {
  private ipAdmissionService = inject(IpAdmissionService);
  private medicineService = inject(MedicineService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
    private prescriptionService = inject(PrescriptionService);
  ipPatients: any[] = [];

  ngOnInit(): void {
    this.loadIPPatients();
  }

  private loadIPPatients(): void {
    this.ipAdmissionService.getCurrentIPPatients().subscribe({
      next: (response: any) => {
        this.ipPatients = response.data || [];
        this.loadPatientPrescriptions();
      },
      error: (err) => {
        console.error('Error loading IP patients:', err);
      }
    });
  }

  private loadPatientPrescriptions(): void {
    this.ipPatients.forEach(patient => {
      if (patient.prescriptionId) {
        this.prescriptionService.getPrescriptionById(patient.prescriptionId).subscribe({
          next: (prescription: any) => {
            patient.prescriptionData = prescription.data;
          }
        });
      }
    });
  }

  calculateStayDays(admissionDate: string): number {
    const admission = new Date(admissionDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - admission.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateRoomCharges(patient: any): number {
    const days = this.calculateStayDays(patient.admissionDate);
    const dailyRate = patient.bedAllocated?.room?.chargesPerDay || 500; // Default rate
    return days * dailyRate;
  }

  calculateMedicineTotal(patient: any): number {
    if (!patient.prescriptionId?.medicines) return 0;
    
    return patient.prescriptionId.medicines.reduce((total: number, med: any) => {
      return total + ((med.unitPrice || 0) * (med.quantity || 1));
    }, 0);
  }

  calculateTotalBill(patient: any): number {
    const roomCharges = this.calculateRoomCharges(patient);
    const medicineTotal = this.calculateMedicineTotal(patient);
    const otherCharges = patient.additionalCharges || 0;
    
    return roomCharges + medicineTotal  + otherCharges;
  }

  generateBill(patient: any): void {
    // Implement bill generation logic
    console.log('Generating bill for:', patient.patient?.fullName);
  }

  addAdditionalCharges(patient: any): void {
    // Implement dialog for adding additional charges
  }
}