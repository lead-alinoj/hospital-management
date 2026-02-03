import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  MatDialogRef, 
  MAT_DIALOG_DATA, 
  MatDialogModule 
} from '@angular/material/dialog';
import { 
  FormBuilder, 
  FormGroup, 
  Validators, 
  ReactiveFormsModule 
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { IpAdmissionService } from '../../service/ip-admission.service';

export interface IpRecommendationDialogData {
  visitId: string;
  patient: {
    _id: string;
    fullName: string;
    age: number;
    gender: string;
    opNumber: string;
  };
  diagnosis?: string;
  vitals?: any;
    role: 'Doctor' | 'Reception'; // ✅ ADD THIS

}

export interface IpAdmissionData {
  visitId: string;
  bedId: string;
  admissionNotes: string;
  expectedStayDays: number;
  admissionType: 'DOCTOR_ADVISED' | 'OBSERVATION'; // FIXED
  nursingInstructions: string;
  observationEndTime?: string;
  observationReason?: string;
  needsFrequentMonitoring?: boolean;
  specialRequirements: {
    needsOxygen: boolean;
    needsIsolation: boolean;
    needsCriticalCare: boolean;
  };
}

@Component({
  selector: 'app-ip-recommendation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    
  ],
  template: `
    <div class="ip-recommendation-dialog">
      <h2 mat-dialog-title>
        <mat-icon>hotel</mat-icon>
        Recommend IP Admission
      </h2>

      <mat-dialog-content>
        <!-- Patient Information -->
        <mat-card class="patient-info-card">
          <mat-card-content>
            <div class="patient-header">
              <div class="patient-name">{{ data.patient.fullName }}</div>
              <div class="patient-details">
                {{ data.patient.age }}Y / {{ data.patient.gender }} | OP: {{ data.patient.opNumber }}
              </div>
            </div>
            
            <div class="diagnosis-section" *ngIf="data.diagnosis">
              <strong>Diagnosis:</strong> {{ data.diagnosis }}
            </div>

            <!-- Vitals Summary -->
            <div class="vitals-summary" *ngIf="data.vitals">
              <h4>Recent Vitals</h4>
              <div class="vitals-grid">
                <div class="vital-item" *ngIf="data.vitals.bloodPressure">
                  <span class="label">BP:</span>
                  <span class="value">{{ data.vitals.bloodPressure.systolic }}/{{ data.vitals.bloodPressure.diastolic }} mmHg</span>
                </div>
                <div class="vital-item" *ngIf="data.vitals.pulse">
                  <span class="label">Pulse:</span>
                  <span class="value">{{ data.vitals.pulse }} bpm</span>
                </div>
                <div class="vital-item" *ngIf="data.vitals.temperature">
                  <span class="label">Temp:</span>
                  <span class="value">{{ data.vitals.temperature }} °F</span>
                </div>
                <div class="vital-item" *ngIf="data.vitals.spo2">
                  <span class="label">SpO₂:</span>
                  <span class="value">{{ data.vitals.spo2 }}%</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Bed Availability -->
<div class="bed-availability-section"
     *ngIf="isReceptionMode && availableBeds.length > 0">
          <h3>Available Beds</h3>
          <div class="bed-selection-grid">
            <div *ngFor="let bed of availableBeds" 
                 class="bed-option"
                 [class.selected]="selectedBed?._id === bed._id"
                 (click)="selectBed(bed)">
              <div class="bed-info">
                <mat-icon class="bed-icon">hotel</mat-icon>
                <div class="bed-details">
                  <span class="bed-number">{{ bed.bedNumber }}</span>
                  <span class="unit-name">{{ bed.careUnit.name }} ({{ bed.careUnit.category }})</span>
                </div>
              </div>
              <div class="bed-status available">
                Available
              </div>
            </div>
          </div>
          
          <div *ngIf="availableBeds.length === 0" class="no-beds">
            <mat-icon>info</mat-icon>
            <p>No beds available. Please check with reception.</p>
          </div>
        </div>

        <!-- Recommendation Form -->
        <form [formGroup]="recommendationForm" *ngIf="availableBeds.length > 0">
          <div class="form-section">
            <h4>Admission Details</h4>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Admission Type</mat-label>
                <mat-select formControlName="admissionType" required>
                  <mat-option value="DOCTOR_ADVISED">Regular Admission</mat-option>
                  <mat-option value="OBSERVATION">Observation Case</mat-option>
                </mat-select>
                <mat-error *ngIf="recommendationForm.get('admissionType')?.hasError('required')">
                  Admission type is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Expected Stay Duration</mat-label>
                <mat-select formControlName="expectedStayDays">
                  <mat-option value="1">1 day</mat-option>
                  <mat-option value="2">2 days</mat-option>
                  <mat-option value="3">3 days</mat-option>
                  <mat-option value="4">4 days</mat-option>
                  <mat-option value="5">5 days</mat-option>
                  <mat-option value="6">6 days</mat-option>
                  <mat-option value="7">7 days</mat-option>
                  <mat-option value="more">More than 7 days</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Admission Notes / Clinical Justification</mat-label>
              <textarea matInput formControlName="admissionNotes" rows="4" required
                placeholder="Clinical reasons for IP admission, monitoring needs, treatment plan..."></textarea>
              <mat-error *ngIf="recommendationForm.get('admissionNotes')?.hasError('required')">
                Admission notes are required
              </mat-error>
            </mat-form-field>

            <!-- Observation-specific fields -->
            <div class="observation-fields" *ngIf="recommendationForm.get('admissionType')?.value === 'OBSERVATION'">
              <h5>Observation Case Details</h5>
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Expected Discharge Time</mat-label>
                  <input matInput type="time" formControlName="observationEndTime">
                  <mat-hint>Same-day discharge expected</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Observation Reason</mat-label>
                  <mat-select formControlName="observationReason">
                    <mat-option value="POST_PROCEDURE">Post Procedure</mat-option>
                    <mat-option value="MONITORING">Vital Monitoring</mat-option>
                    <mat-option value="MEDICATION_RESPONSE">Medication Response</mat-option>
                    <mat-option value="PAIN_MANAGEMENT">Pain Management</mat-option>
                    <mat-option value="OTHER">Other</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-checkbox formControlName="needsFrequentMonitoring">
                Requires frequent monitoring (every 1-2 hours)
              </mat-checkbox>
            </div>

            <!-- Additional instructions -->
            <div class="form-section">
              <h5>Instructions for Nursing Staff</h5>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nursing Instructions</mat-label>
                <textarea matInput formControlName="nursingInstructions" rows="3"
                  placeholder="Specific instructions for nursing care..."></textarea>
              </mat-form-field>
            </div>

            <!-- Special Requirements -->
            <div class="form-section">
              <h5>Special Requirements</h5>
              <div class="checkbox-group">
                <mat-checkbox formControlName="needsOxygen">Oxygen Required</mat-checkbox>
                <mat-checkbox formControlName="needsIsolation">Isolation Room</mat-checkbox>
                <mat-checkbox formControlName="needsCriticalCare">Close Monitoring</mat-checkbox>
              </div>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        
        <button mat-button
  *ngIf="isDoctorMode"
  (click)="saveAsRecommendationOnly()">
  Save as Recommendation
</button>

        
      <button mat-raised-button
  *ngIf="isReceptionMode"
  (click)="onSubmit()">
  Admit Patient Now
</button>

      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .ip-recommendation-dialog {
      min-width: 600px;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    h2.mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #1976d2;
      margin: 0;
      padding: 20px 24px 10px;
    }
    
    mat-dialog-content {
      padding: 0 24px;
    }
    
    .patient-info-card {
      margin-bottom: 20px;
      background: #f8f9fa;
    }
    
    .patient-header {
      margin-bottom: 15px;
    }
    
    .patient-name {
      font-size: 18px;
      font-weight: 500;
      color: #1976d2;
    }
    
    .patient-details {
      font-size: 14px;
      color: #666;
    }
    
    .diagnosis-section {
      margin: 15px 0;
      padding: 10px;
      background: #fff3e0;
      border-radius: 4px;
    }
    
    .vitals-summary {
      margin-top: 15px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    
    .vitals-summary h4 {
      margin: 0 0 10px 0;
      color: #555;
    }
    
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    
    .vital-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }
    
    .vital-item:last-child {
      border-bottom: none;
    }
    
    .vital-item .label {
      font-weight: 500;
      color: #666;
    }
    
    .vital-item .value {
      font-weight: 500;
      color: #333;
    }
    
    .bed-availability-section {
      margin: 20px 0;
    }
    
    .bed-availability-section h3 {
      margin: 0 0 15px 0;
      color: #1976d2;
    }
    
    .bed-selection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
      margin-bottom: 20px;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .bed-option {
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }
    
    .bed-option:hover {
      border-color: #1976d2;
      background: #f0f8ff;
      transform: translateY(-2px);
    }
    
    .bed-option.selected {
      border-color: #1976d2;
      background: #e3f2fd;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
    }
    
    .bed-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    
    .bed-icon {
      color: #1976d2;
    }
    
    .bed-details {
      display: flex;
      flex-direction: column;
    }
    
    .bed-number {
      font-size: 16px;
      font-weight: bold;
      color: #333;
    }
    
    .unit-name {
      font-size: 12px;
      color: #666;
    }
    
    .bed-status {
      font-size: 12px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 12px;
      text-align: center;
      width: fit-content;
    }
    
    .bed-status.available {
      background: #4caf50;
      color: white;
    }
    
    .no-beds {
      text-align: center;
      padding: 30px;
      color: #666;
    }
    
    .no-beds mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 10px;
      color: #ff9800;
    }
    
    .form-section {
      margin: 20px 0;
    }
    
    .form-section h4, .form-section h5 {
      margin: 0 0 15px 0;
      color: #333;
    }
    
    .form-row {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .full-width { width: 100%; }
    .half-width { flex: 1; }
    
    .observation-fields {
      background: #fff8e1;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
    }
    
    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }
    
    mat-dialog-actions {
      padding: 15px 24px;
      border-top: 1px solid #eee;
    }
    
    mat-dialog-actions button {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    /* Scrollbar styling */
    ::-webkit-scrollbar {
      width: 6px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 3px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .ip-recommendation-dialog {
        min-width: 95vw;
      }
      
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .half-width {
        width: 100%;
        margin-bottom: 15px;
      }
      
      .bed-selection-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class IpRecommendationDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ipService = inject(IpAdmissionService);
  private snackBar = inject(MatSnackBar);
  
  recommendationForm!: FormGroup;
  availableBeds: any[] = [];
  selectedBed: any = null;
  isLoading = false;
isDoctorMode = false;
isReceptionMode = false;

  constructor(
    public dialogRef: MatDialogRef<IpRecommendationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IpRecommendationDialogData
  ) {}

 ngOnInit() {
  this.isDoctorMode = this.data.role === 'Doctor';
  this.isReceptionMode = this.data.role === 'Reception';

  this.initForm();

  if (this.isReceptionMode) {
    this.loadAvailableBeds(); // ✅ only reception loads beds
  }
}


  initForm() {
    this.recommendationForm = this.fb.group({
      admissionType: ['DOCTOR_ADVISED', Validators.required],
      admissionNotes: ['', Validators.required],
      expectedStayDays: ['3'],
      nursingInstructions: [''],
      needsOxygen: [false],
      needsIsolation: [false],
      needsCriticalCare: [false],
      
      // Observation-specific fields
      observationEndTime: [''],
      observationReason: [''],
      needsFrequentMonitoring: [false]
    });
  }

loadAvailableBeds() {
  this.isLoading = true;
  this.ipService.getBedAvailability().subscribe({
    next: (res: any) => {
      console.log('Bed availability response:', res);

      this.availableBeds = res?.data?.availableBeds || [];
      console.log('Available beds:', this.availableBeds);

      this.isLoading = false;
    },
    error: err => {
      console.error(err);
      this.isLoading = false;
    }
  });
}


  selectBed(bed: any) {
    this.selectedBed = bed;
  }

 
onSubmit() {
  if (!this.selectedBed) {
    this.showError('Please select a bed');
    return;
  }

  const admissionData = {
    visitId: this.data.visitId,
    bedId: this.selectedBed._id,
    admissionNotes: this.recommendationForm.value.admissionNotes,
    expectedStayDays: Number(this.recommendationForm.value.expectedStayDays),
    admissionType: this.recommendationForm.value.admissionType,
    nursingInstructions: this.recommendationForm.value.nursingInstructions,
    specialRequirements: {
      needsOxygen: this.recommendationForm.value.needsOxygen,
      needsIsolation: this.recommendationForm.value.needsIsolation,
      needsCriticalCare: this.recommendationForm.value.needsCriticalCare
    }
  };

  this.ipService.allocateRecommendedAdmission(admissionData)
    .subscribe({
      next: () => {
        this.showSuccess('Patient admitted successfully');
        this.dialogRef.close(true);
      },
      error: () => {
        this.showError('Admission failed');
      }
    });
}



  onCancel() {
    this.dialogRef.close({
      action: 'CANCELLED'
    });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
saveAsRecommendationOnly() {
  console.log('🟢 Saving IP recommendation...');
  console.log('👉 Visit ID:', this.data.visitId);
  console.log('👉 Admission notes:', this.recommendationForm.value.admissionNotes);
  console.log('👉 Admission type:', this.recommendationForm.value.admissionType);

  this.ipService.recommendIpAdmission({
    visitId: this.data.visitId,
    admissionNotes: this.recommendationForm.value.admissionNotes,
    admissionType: this.recommendationForm.value.admissionType
  }).subscribe({
    next: (response) => {
      console.log('✅ Recommendation saved:', response);
      this.showSuccess('IP recommendation saved successfully. Reception will admit.');
      this.dialogRef.close(true);
    },
    error: (error) => {
      console.error('❌ Error saving recommendation:', error);
      this.showError(error.error?.message || 'Failed to save recommendation');
    }
  });
}

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}