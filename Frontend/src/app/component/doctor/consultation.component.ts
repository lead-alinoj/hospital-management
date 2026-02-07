import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VisitService } from '../../service/visit.service';
import { VitalsService } from '../../service/vitals.service';
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FormArray } from '@angular/forms';
import { MedicineService } from '../../service/medicine.service';
import { PrescriptionService } from '../../service/prescription.service';
import { PdfService } from '../../service/pdf.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from "@angular/material/divider";
import { ChangeDetectorRef } from '@angular/core';
import { IpRecommendationDialogComponent } from './ip-recommendation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../auth/auth.service';
import { IpAdmissionService } from '../../service/ip-admission.service';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatExpansionModule,
    MatDividerModule,
    
],
  template: `
    <div class="consultation-container">
      <!-- Patient Header -->
      <mat-card class="patient-header">
        <div class="header-content">
          <div class="patient-basic">
            <div class="patient-name">{{ visit?.patient?.fullName }}</div>
            <div class="patient-details">
              <span class="detail-item">Token: {{ visit?.tokenNumber }}</span>
              <span class="detail-item">{{ visit?.patient?.age }}Y / {{ visit?.patient?.gender }}</span>
              <span class="detail-item">OP: {{ visit?.patient?.opNumber }}</span>
              <span class="detail-item">Priority: {{ visit?.priority }}</span>
            </div>
          </div>
          <div class="visit-info">
            <div class="info-item">
              <span class="label">Chief Complaint:</span>
              <span class="value">{{ visit?.chiefComplaint || 'Not specified' }}</span>
            </div>
          </div>
        </div>
      </mat-card>

      <!-- Main Content Tabs -->
<mat-tab-group animationDuration="0ms">
        <!-- Vitals Tab -->
        <mat-tab label="Vitals">
          <div class="tab-content">
           <!-- In consultation.component.html - Update vitals section -->
<mat-card *ngIf="vitals">
  <mat-card-header>
    <mat-card-title>Vitals Record</mat-card-title>
    <mat-card-subtitle>Recorded by Nurse</mat-card-subtitle>
  </mat-card-header>
  
  <mat-card-content>
    <div class="vitals-grid">
      <!-- Height/Weight/BMI Section -->
      <div class="vital-item">
        <span class="label">Height/Weight</span>
        <span class="value">
          {{ vitals.height }} cm / {{ vitals.weight }} kg
        </span>
      </div>
      
      <div class="vital-item">
        <span class="label">BMI</span>
        <span class="value">{{ vitals.bmi | number:'1.1-1' }}</span>
      </div>

      <!-- Blood Pressure -->
      <div class="vital-item" *ngIf="vitals.bloodPressure?.systolic">
        <span class="label">Blood Pressure</span>
        <span class="value">
          {{ vitals.bloodPressure.systolic }}/{{ vitals.bloodPressure.diastolic }} mmHg
        </span>
      </div>

      <!-- Pulse -->
      <div class="vital-item" *ngIf="vitals.pulse">
        <span class="label">Pulse Rate</span>
        <span class="value">{{ vitals.pulse }} bpm</span>
      </div>

      <!-- Temperature -->
      <div class="vital-item" *ngIf="vitals.temperature">
        <span class="label">Temperature</span>
        <span class="value">{{ vitals.temperature }} °F</span>
      </div>

      <!-- SpO2 -->
      <div class="vital-item" *ngIf="vitals.spo2">
        <span class="label">SpO₂</span>
        <span class="value">{{ vitals.spo2 }} %</span>
      </div>

      <!-- Respiratory Rate -->
      <div class="vital-item" *ngIf="vitals.respiratoryRate">
        <span class="label">Respiratory Rate</span>
        <span class="value">{{ vitals.respiratoryRate }} breaths/min</span>
      </div>

      <!-- Blood Sugar -->
      <div class="vital-item" *ngIf="vitals.bloodSugar?.value">
        <span class="label">Blood Sugar</span>
        <span class="value">{{ vitals.bloodSugar.value }} mg/dL ({{ vitals.bloodSugar.type || 'Random' }})</span>
      </div>
    </div>
    
    <div *ngIf="vitals.remarks" class="remarks-section">
      <h4>Remarks</h4>
      <p>{{ vitals.remarks }}</p>
    </div>
    
    <div class="record-info">
      <span>Recorded by: {{ vitals.recordedBy?.name || 'Nurse' }} at {{ vitals.createdAt | date:'short' }}</span>
    </div>
  </mat-card-content>
</mat-card>

            <mat-card *ngIf="!vitals">
              <mat-card-content class="no-data">
                <mat-icon>info</mat-icon>
                <p>Vitals not recorded yet. Patient is with nurse.</p>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

     <mat-tab label="Patient History">
  <div class="tab-content">

<mat-card *ngIf="patientHistory && patientHistory.length === 0">
      <mat-card-content class="no-data">
        <mat-icon>history</mat-icon>
        <p>No previous consultation history</p>
      </mat-card-content>
    </mat-card>

<mat-accordion *ngIf="patientHistory && patientHistory.length > 0">
      <mat-expansion-panel *ngFor="let h of patientHistory">
        <mat-expansion-panel-header>
          <mat-panel-title>
            {{ h.visitId?.visitDate | date:'dd MMM yyyy' }}
            • OP: {{ h.visitId?.opNumber || visit?.patient?.opNumber }}
          </mat-panel-title>
         <mat-panel-description>
  {{ h.diagnosis || h.visitId?.diagnosis || 'No diagnosis' }}
</mat-panel-description>

        </mat-expansion-panel-header>

        <div class="history-section">
          <p><b>Doctor:</b> {{ h.doctorId?.name }}</p>
          <p><b>Chief Complaint:</b> {{ h.visitId?.chiefComplaint }}</p>
          <p><b>Advice:</b> {{ h.advice || '-' }}</p>

          <h4>Medicines</h4>

          <p *ngIf="!h.medicines || h.medicines.length === 0" class="no-data">
            No medicines prescribed
          </p>

          <table *ngIf="h.medicines?.length" class="history-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Timing</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of h.medicines">
                <td>{{ m.medicineName }}</td>
                <td>{{ m.quantity }} × {{ m.days }} days</td>
                <td>{{ m.take }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </mat-expansion-panel>
    </mat-accordion>

  </div>
</mat-tab>


        <!-- Diagnosis & Prescription Tab -->
        <mat-tab label="Diagnosis & Prescription">
          <div class="tab-content">
            <form [formGroup]="consultationForm" (ngSubmit)="saveConsultation()">
              
              <!-- Diagnosis Section -->
              <mat-card class="section-card">
                <mat-card-header>
                  <mat-card-title>Diagnosis</mat-card-title>
                </mat-card-header>
                
                <mat-card-content>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Diagnosis</mat-label>
                    <textarea matInput formControlName="diagnosis" rows="3" 
                      placeholder="Enter primary diagnosis..."></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>ICD-10 Code (Optional)</mat-label>
                    <input matInput formControlName="icd10Code" placeholder="e.g., J06.9">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Clinical Notes</mat-label>
                    <textarea matInput formControlName="clinicalNotes" rows="4"
                      placeholder="Detailed clinical findings, observations..."></textarea>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="half-width">
  <mat-label>Patient Type</mat-label>
  <mat-select formControlName="patientType">
    <mat-option value="OP">OP – Out Patient</mat-option>
    <mat-option value="IP">IP – In Patient</mat-option>
  </mat-select>
</mat-form-field>

                </mat-card-content>
              </mat-card>

              <!-- Prescription Section -->
              <mat-card class="section-card">
                <mat-card-header>
                  <mat-card-title>Prescription</mat-card-title>
                  <button mat-button color="primary" type="button" (click)="addMedication()">
                    <mat-icon>add</mat-icon> Add Medication
                  </button>
                </mat-card-header>

                <mat-card-content>
                  <div formArrayName="medications">
                    <div *ngFor="let med of medications.controls; let i = index" [formGroupName]="i" 
                      class="medication-row">
                      
                     <div class="prescription-grid">

  <!-- SI NO -->
  <div class="si-no">{{ i + 1 }}</div>

  <!-- MEDICINE -->
  <mat-form-field appearance="outline" class="med-name">
    <mat-label>Medicine</mat-label>
   <input
  matInput
  formControlName="name"
  [matAutocomplete]="auto"
  (input)="filterMedicines($event, i)"
  placeholder="Search or type medicine">


    <mat-autocomplete #auto="matAutocomplete"
      (optionSelected)="onMedicineSelected($event.option.value, i)">
      <mat-option *ngFor="let med of filteredMedicines" [value]="med">
        <div class="option-row">
          <span>{{ med.name }} {{ med.strength }}{{ med.unit }}</span>
          <small
            [style.color]="
              med.stockQty === 0 ? 'red' :
              med.stockQty <= med.minStock ? 'orange' : 'green'
            ">
            {{ med.stockQty === 0 ? 'Out' :
               med.stockQty <= med.minStock ? 'Low' : 'In' }}
          </small>
        </div>
      </mat-option>
    </mat-autocomplete>
    
  </mat-form-field>

  <!-- QTY -->
<!-- QTY -->
<mat-form-field appearance="outline" class="qty">
  <mat-label>Qty</mat-label>
  <input matInput type="number" formControlName="quantity" min="1"> <!-- Changed from qty to quantity -->
</mat-form-field>
  <!-- TAKE -->
  <mat-form-field appearance="outline" class="take">
    <mat-label>Take</mat-label>
    <mat-select formControlName="take">
      <mat-option value="After Food">After Food</mat-option>
      <mat-option value="Before Food">Before Food</mat-option>
      <mat-option value="With Food">With Food</mat-option>
    </mat-select>
  </mat-form-field>

  <!-- MORNING -->
  <mat-form-field appearance="outline" class="dose">
    <mat-label>Morning</mat-label>
    <input matInput formControlName="morning" placeholder="3.5 ml">
  </mat-form-field>

  <!-- NOON -->
  <mat-form-field appearance="outline" class="dose">
    <mat-label>Noon</mat-label>
    <input matInput formControlName="noon" placeholder="1 ml">
  </mat-form-field>

  <!-- EVENING -->
  <mat-form-field appearance="outline" class="dose">
    <mat-label>Eve</mat-label>
    <input matInput formControlName="evening" placeholder="1 ml">
  </mat-form-field>

  <!-- NIGHT -->
  <mat-form-field appearance="outline" class="dose">
    <mat-label>Night</mat-label>
    <input matInput formControlName="night" placeholder="3.5 ml">
  </mat-form-field>

  <!-- DAYS -->
  <mat-form-field appearance="outline" class="days">
    <mat-label>Days</mat-label>
    <input matInput type="number" formControlName="days">
  </mat-form-field>

  <!-- DELETE -->
  <button mat-icon-button color="warn"
    type="button"
    (click)="removeMedication(i)">
    <mat-icon>delete</mat-icon>
  </button>

</div>


                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Instructions</mat-label>
                        <input matInput formControlName="instructions" 
                          placeholder="Special instructions...">
                      </mat-form-field>
                    </div>
                  </div>

                  <div *ngIf="medications.length === 0" class="no-medications">
                    <p>No medications added yet</p>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Follow-up & Advice -->
              <mat-card class="section-card">
                <mat-card-header>
                  <mat-card-title>Follow-up & Advice</mat-card-title>
                </mat-card-header>

                <mat-card-content>
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Follow-up Date</mat-label>
                    <input matInput [matDatepicker]="followupPicker" formControlName="followupDate">
                    <mat-datepicker-toggle matSuffix [for]="followupPicker"></mat-datepicker-toggle>
                    <mat-datepicker #followupPicker></mat-datepicker>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Advice to Patient</mat-label>
                    <textarea matInput formControlName="advice" rows="3"
                      placeholder="Diet, lifestyle, precautions..."></textarea>
                  </mat-form-field>
                </mat-card-content>
              </mat-card>

              <!-- Submit -->
              <div class="form-actions">
                <button mat-button type="button" (click)="cancel()">Cancel</button>
 <button mat-raised-button color="primary"
        (click)="openIpRecommendation(visit)">
  <mat-icon>hotel</mat-icon>
  Recommend IP
</button>


                <button
  mat-button
  color="accent"
  *ngIf="visit?.visitStatus === 'Consultation_Completed'"
  (click)="printPrescription()">
  <mat-icon>print</mat-icon>
  Print Prescription
</button>


                <button mat-raised-button color="primary" type="submit" 
                  [disabled]="consultationForm.invalid || isLoading">
                  {{ isLoading ? 'Saving...' : 'Complete Consultation' }}
                </button>
              </div>
            </form>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
 /* ==============================
   GLOBAL BASE
============================== */
:host {
  --primary: #1a73e8;
  --secondary: #0d8a72;
  --accent: #ff9800;
  --danger: #e53935;

  --bg: #f8fafc;
  --card: #ffffff;
  --border: #e2e8f0;
  --text: #1e293b;
  --muted: #64748b;
}

/* ==============================
   MAIN CONTAINER
============================== */
.consultation-container {
  background: var(--bg);
  min-height: 100vh;
  padding: 20px;
  max-width: 1300px;
  margin: auto;
  font-family: 'Roboto', 'Segoe UI', sans-serif;
}

/* ==============================
   PATIENT HEADER
============================== */
.patient-header {
  background: linear-gradient(135deg, #ffffff, #f1f5f9);
  border-radius: 14px;
  border-left: 5px solid var(--primary);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.header-content {
  padding: 20px;
}

.patient-name {
  font-size: 24px;
  font-weight: 600;
  color: var(--text);
}

.patient-details {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.detail-item {
  background: #ffffff;
  border: 1px solid var(--border);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  color: var(--muted);
}

/* ==============================
   TAB CONTENT
============================== */
.tab-content {
  padding: 20px 5px;
}

/* ==============================
   CARD STANDARD
============================== */
mat-card {
  border-radius: 14px;
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.section-card {
  margin-bottom: 20px;
}

mat-card-title {
  font-weight: 600;
  color: var(--text);
}

/* ==============================
   VITALS
============================== */
.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
}

.vital-item {
  background: #f9fbff;
  border-left: 4px solid var(--primary);
  padding: 14px;
  border-radius: 10px;
}

.vital-item .label {
  font-size: 12px;
  color: var(--muted);
}

.vital-item .value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}

/* ==============================
   HISTORY
============================== */
.history-section {
  padding: 10px 0;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th,
.history-table td {
  padding: 8px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

/* ==============================
   PRESCRIPTION
============================== */
.medication-row {
  background: #f9fafb;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
}

.prescription-grid {
  display: grid;
  grid-template-columns:
    40px
    2.5fr
    70px
    120px
    90px
    90px
    90px
    90px
    70px
    40px;
  gap: 8px;
  align-items: center;
}

.si-no {
  text-align: center;
  font-weight: 600;
  color: var(--primary);
}

/* ==============================
   FORM FIELDS
============================== */
mat-form-field {
  width: 100%;
}

.mat-form-field-appearance-outline .mat-form-field-outline {
  color: var(--border);
}

.mat-form-field.mat-focused .mat-form-field-outline-thick {
  color: var(--primary);
}

/* ==============================
   BUTTONS
============================== */
button[mat-raised-button] {
  border-radius: 10px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
}

button mat-icon {
  margin-right: 6px;
}

/* ==============================
   EMPTY STATES
============================== */
.no-data {
  text-align: center;
  padding: 40px;
  color: var(--muted);
}

.no-data mat-icon {
  font-size: 48px;
  color: #cbd5e1;
}

/* ==============================
   SNACKBAR
============================== */
::ng-deep .success-snackbar {
  background: var(--secondary);
  color: #fff;
}

::ng-deep .error-snackbar {
  background: var(--danger);
  color: #fff;
}

/* ==============================
   RESPONSIVE
============================== */
@media (max-width: 1024px) {
  .prescription-grid {
    grid-template-columns: 40px 1fr 70px 1fr;
  }
}

@media (max-width: 768px) {
  .patient-details {
    flex-direction: column;
  }

  .prescription-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .consultation-container {
    padding: 10px;
  }

  .patient-name {
    font-size: 20px;
  }

  mat-card {
    border-radius: 10px;
  }
}

  `]
})
export class ConsultationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private visitService = inject(VisitService);
  private vitalsService = inject(VitalsService);
  private snackBar = inject(MatSnackBar);
  private medicineService = inject(MedicineService);
  private prescriptionService = inject(PrescriptionService);
  private pdfService = inject(PdfService);
private dialog = inject(MatDialog);
private authService = inject(AuthService); // Add this
private ipAdmissionService = inject(IpAdmissionService);

  // private pdfService = inject(PdfService);
private cdr = inject(ChangeDetectorRef);

  medicines: any[] = [];
  filteredMedicines: any[] = [];
  isGeneratingPDF = false;
  visit: any = null;
  vitals: any = null;
  consultationForm!: FormGroup;
  isLoading = false;
patientHistory: any[] = [];

  displayedColumns = ['testName', 'result', 'referenceRange', 'status'];

  ngOnInit(): void {
    this.initForm();
    this.loadVisitData();
        this.loadMedicines();

  }
private loadMedicines(): void {
  this.medicineService.getDoctorMedicines().subscribe({ // Use the correct endpoint
    next: (response: any) => {
      const allMedicines = response?.data || response || [];

      // Filter medicines where category type is 'Medicine'
      this.medicines = allMedicines.filter(
        (m: any) => m.category?.type === 'Medicine'
      );

      this.filteredMedicines = [...this.medicines];
      console.log('Loaded medicines for doctor:', this.filteredMedicines);
    },
    error: (error) => {
      console.error('Error loading medicines:', error);
      this.medicines = [];
      this.filteredMedicines = [];
    }
  });
}

private loadPatientHistory(): void {
  const patientId = this.visit?.patient?._id;
  if (!patientId) return;

  this.prescriptionService.getPatientHistory(patientId).subscribe({
    next: (res) => {
      this.patientHistory = res.data || [];
      this.cdr.detectChanges(); // 🔥 IMPORTANT
    },
    error: (err) => {
      console.error('History load error', err);
      this.patientHistory = [];
      this.cdr.detectChanges(); // 🔥 IMPORTANT
    }
  });
}



filterMedicines(event: Event, index?: number): void {
  const input = (event.target as HTMLInputElement).value;

  if (index !== undefined) {
    const medGroup = this.medications.at(index);
    medGroup.patchValue({
      medicineId: null,
      isManual: true
    });
  }

  this.filteredMedicines = this.medicines.filter(med =>
    med.name.toLowerCase().includes(input.toLowerCase())
  );
}



getStockLabel(medicineId: string): string {
  const med = this.medicines.find(m => m._id === medicineId);
  if (!med) return '';

  if (med.stockQty <= 0) return 'Out of Stock';
  if (med.stockQty <= med.minStock) return 'Low Stock';
  return 'In Stock';
}

getStockClass(medicineId: string): string {
  const med = this.medicines.find(m => m._id === medicineId);
  if (!med) return '';

  if (med.stockQty <= 0) return 'stock-red';
  if (med.stockQty <= med.minStock) return 'stock-orange';
  return 'stock-green';
}

  getMedicineStockStatus(medicineId: string): string {
    const medicine = this.medicines.find(m => m._id === medicineId);
    if (!medicine) return 'Not available';
    
    if (medicine.stockQty <= 0) return 'Out of stock';
    if (medicine.stockQty <= medicine.minStock) return 'Low stock';
    return 'In stock';
  }
  private initForm(): void {
    this.consultationForm = this.fb.group({
      diagnosis: ['', Validators.required],
      icd10Code: [''],
      clinicalNotes: [''],
          patientType: ['OP', Validators.required],

      medications: this.fb.array([]),
      followupDate: [''],
      advice: ['']
    });
  }

  get medications() {
    return this.consultationForm.get('medications') as any;
  }
recommendIPAdmission() {
  this.router.navigate(['/doctor/ip-admission', this.visit._id], {
    state: {
      visitId: this.visit._id,
      source: 'DOCTOR'
    }
  });
}

private showSuccess(message: string): void {
  this.snackBar.open(message, 'Close', {
    duration: 3000,
    panelClass: ['success-snackbar']
  });
}
private loadVisitData(): void {
  const visitId = this.route.snapshot.paramMap.get('visitId');
  if (visitId) {
    this.isLoading = true; // Add loading state
    
    // Load visit WITH populated patient data
    this.visitService.getVisitById(visitId).subscribe({
      next: (response: any) => {
        // Make sure we get the full response data
        this.visit = response.data || response;
        
        // Debug log to check the data structure
        console.log('Visit data:', this.visit);
        console.log('Patient data:', this.visit?.patient);
        
        // Load vitals and lab results
        this.loadVitals();
        this.loadPatientHistory(); // 🔥 ADD THIS

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading visit:', error);
        this.showError('Error loading visit data');
        this.isLoading = false;
      }
    });
  }
}

// In consultation.component.ts - Update the loadVitals method
private loadVitals(): void {
  // Try both ways - from visit object and by API
  if (this.visit?.vitals) {
    // If visit already has vitals populated
    this.vitals = this.visit.vitals;
  } else if (this.visit?._id) {
    // If not, fetch by visit ID
    this.vitalsService.getVitalsByVisit(this.visit._id).subscribe({
      next: (response) => {
        this.vitals = response.data;
      },
      error: (error) => {
        console.error('Error loading vitals:', error);
        this.vitals = null;
      }
    });
  }
}
// In consultation.component.ts, replace the loadLabResults method:




// Or update the service to return a proper typed response

  getReferenceRange(result: any): string {
    if (result.referenceRange?.text) {
      return result.referenceRange.text;
    }
    if (result.referenceRange?.low && result.referenceRange?.high) {
      return `${result.referenceRange.low} - ${result.referenceRange.high}`;
    }
    return '-';
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'Pending': 'status-pending',
      'Sample_Collected': 'status-pending',
      'Processing': 'status-pending',
      'Completed': 'status-completed',
      'Cancelled': 'status-cancelled'
    };
    return statusMap[status] || '';
  }

  addMedication(): void {
  const medicationGroup = this.fb.group({
 medicineId: [null],          // 🔥 NOT required for manual
    isManual: [false],           // 🔥 NEW    name: ['', Validators.required],
    name: ['', Validators.required],
    strength: [''],

   quantity: [1, [Validators.required, Validators.min(1)]],
    take: ['After Food', Validators.required],

    morning: [''],
    noon: [''],
    evening: [''],
    night: [''],

     days: [1, [Validators.required, Validators.min(1)]],
    instructions: ['']
  });

  this.medications.push(medicationGroup);
}
 onMedicineSelected(medicine: any, index: number): void {
    const medGroup = this.medications.at(index);
    medGroup.patchValue({
      medicineId: medicine._id,
      name: medicine.name,
      strength: medicine.strength,
          isManual: false,
      quantity: 1
    });
  }

  removeMedication(index: number): void {
    this.medications.removeAt(index);
  }

async saveConsultation(): Promise<void> {
  if (this.consultationForm.invalid) return;

  this.isLoading = true;
  
  try {
    // Get patient type
    const patientType = this.consultationForm.get('patientType')?.value;
    
    // Prepare prescription data
    const prescriptionData = {
      visitId: this.visit._id,
      diagnosis: this.consultationForm.get('diagnosis')?.value,
      icd10Code: this.consultationForm.get('icd10Code')?.value,
      clinicalNotes: this.consultationForm.get('clinicalNotes')?.value,
      medicines: this.medications.length > 0
        ? this.medications.value.map((med: any) => ({
            medicineId: med.medicineId || null,
            name: med.name,
            quantity: med.quantity,
            take: med.take,
            morning: !!med.morning,
            noon: !!med.noon,
            evening: !!med.evening,
            night: !!med.night,
            days: med.days,
            instructions: med.instructions,
            type: med.medicineId ? 'STOCK' : 'MANUAL'
          }))
        : [],
      advice: this.consultationForm.get('advice')?.value,
      followupDate: this.consultationForm.get('followupDate')?.value,
      patientType: patientType
    };

    // Save prescription
    const prescriptionResponse = await this.prescriptionService
      .createPrescription(prescriptionData)
      .toPromise();

    if (prescriptionResponse && (prescriptionResponse as any).success) {
      
      // 🔥 CRITICAL: If patientType is IP, DO NOT show in pharmacy
      if (patientType === 'IP') {
        // Only show success message for IP - no pharmacy visibility
        this.snackBar.open('IP admission recommended successfully. Patient details sent to IP dashboard.', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      } else {
        // OP patients - normal flow
        this.snackBar.open('Consultation completed & prescription sent to pharmacy!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        
        // Optionally generate PDF for OP
        // await this.generateAndDownloadPrescription((prescriptionResponse as any).data);
      }

      // Navigate back after delay
      setTimeout(() => {
        history.back();
      }, 2000);
    } else {
      throw new Error('Failed to save prescription');
    }
    
  } catch (error: any) {
    console.error('Error saving consultation:', error);
    this.showError(error.error?.message || 'Error saving consultation');
  } finally {
    this.isLoading = false;
  }
}
onManualMedicine(event: Event, index: number) {
  const value = (event.target as HTMLInputElement).value;

  const medGroup = this.medications.at(index);
  medGroup.patchValue({
    medicineId: null,
    name: value,
    isManual: true
  }, { emitEvent: false });
}

// In consultation.component.ts - Update the openIpRecommendation method
openIpRecommendation(visit: any) {
  console.log('🟢 Recommend IP clicked');
  
  const dialogRef = this.dialog.open(IpRecommendationDialogComponent, {
    width: '900px',
    disableClose: true,
    data: {
      visitId: visit._id,
      patient: visit.patient,
      diagnosis: this.consultationForm.get('diagnosis')?.value || visit.diagnosis,
      vitals: visit.vitals,
      role: 'Doctor'
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.snackBar.open('IP recommendation saved successfully', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      
      // If successful, update the current visit status locally
      if (result.success) {
        this.visit.visitStatus = 'IP_RECOMMENDED';
        this.visit.admissionStatus = 'NOT_ADMITTED';
        this.visit.admissionType = result.data?.admissionType;
      }
    }
  });
}
async printPrescription(): Promise<void> {
  if (!this.visit?._id) return;

  try {
    const res = await this.prescriptionService
      .getPrescriptionByVisit(this.visit._id)
      .toPromise();

    const prescription = res?.data || res;
    const pdf = await this.pdfService.generatePrescriptionPDF(
      prescription,
      this.vitals
    );

    pdf.save(`Prescription_${this.visit.patient.fullName}.pdf`);
  } catch (e) {
    this.showError('Failed to print prescription');
  }
}

  cancel(): void {
    history.back();
  }


  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}