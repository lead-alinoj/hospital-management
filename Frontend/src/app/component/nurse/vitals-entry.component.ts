import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatOptionModule } from "@angular/material/core";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute } from "@angular/router";
import { VisitService } from "../../service/visit.service";
import { VitalsService } from "../../service/vitals.service";

@Component({
  selector: 'app-vitals-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <div class="vitals-container">
      <!-- Patient Info Header -->
      <mat-card class="patient-header">
        <div class="patient-info">
          <div class="info-row">
            <span class="label">Token</span>
            <span class="value token-badge">{{ visit?.tokenNumber }}</span>
          </div>
          <div class="info-row">
            <span class="label">Patient</span>
            <span class="value">{{ getPatientName(visit) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Age / Gender</span>
            <span class="value">{{ getPatientAge(visit) }}Y / {{ getPatientGender(visit) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Doctor</span>
            <span class="value">{{ getDoctorName(visit) }}</span>
          </div>
        </div>
      </mat-card>

      <!-- Vitals Form -->
      <div class="vitals-form-container">
        <div class="form-header">
          <h2>Record Vitals</h2>
          <div class="subtitle">Enter patient measurements and observations</div>
        </div>

        <div class="form-content">
          <form [formGroup]="vitalsForm" (ngSubmit)="onSubmit()">
            <!-- Basic Measurements -->
            <h3 class="section-title">Basic Measurements</h3>
            <div class="measurement-grid">
             <mat-form-field appearance="outline" class="form-field curved-field">
  <mat-label>Height (cm) *</mat-label>
<mat-icon matPrefix class="cute-icon height-icon">height</mat-icon>

  <input matInput type="number" formControlName="height" min="50" max="250" step="0.1">
  <span matSuffix>cm</span>
  <mat-error *ngIf="vitalsForm.get('height')?.hasError('required')">
    Height is required
  </mat-error>
</mat-form-field>


            <mat-form-field appearance="outline" class="form-field curved-field">
  <mat-label>Weight (kg) *</mat-label>
   <mat-icon matPrefix class="cute-icon weight-icon">monitor_weight</mat-icon>

  <input matInput type="number" formControlName="weight" min="2" max="300" step="0.1">
  <span matSuffix>kg</span>
  <mat-error *ngIf="vitalsForm.get('weight')?.hasError('required')">
    Weight is required
  </mat-error>
</mat-form-field>


              <div class="bmi-display" *ngIf="calculatedBMI > 0">
                <div>
                  <span class="bmi-label">Body Mass Index</span>
                  <div class="bmi-value" [ngClass]="getBMIClass(calculatedBMI)">
                    {{ calculatedBMI | number:'1.1-1' }}
                  </div>
                </div>
                <span class="bmi-category">{{ getBMICategory(calculatedBMI) }}</span>
              </div>
            </div>

            <!-- Vital Signs -->
            <h3 class="section-title">Vital Signs</h3>
            <div class="measurement-grid">
              <mat-form-field appearance="outline" class="form-field curved-field">
                <mat-label>BP Systolic</mat-label>
                <mat-icon matPrefix class="cute-icon heart-icon">favorite</mat-icon>

                <input matInput type="number" formControlName="bpSystolic" min="50" max="250">
                <span matSuffix>mmHg</span>
                <mat-error *ngIf="vitalsForm.get('bpSystolic')?.hasError('required')">
                  Systolic BP is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field curved-field">
                <mat-label>BP Diastolic</mat-label>
                 <mat-icon matPrefix class="cute-icon heart-icon">favorite_border</mat-icon>

                <input matInput type="number" formControlName="bpDiastolic" min="30" max="150">
                <span matSuffix>mmHg</span>
               
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field curved-field">
                <mat-label>Pulse Rate</mat-label>
<mat-icon matPrefix class="cute-icon pulse-icon">monitor_heart</mat-icon>
                <input matInput type="number" formControlName="pulse" min="30" max="200">
                <span matSuffix>bpm</span>
                
              </mat-form-field>

              <mat-form-field appearance="outline"class="form-field curved-field">
                <mat-label>Temperature</mat-label>
<mat-icon matPrefix class="cute-icon temp-icon">thermostat</mat-icon>
<input
  matInput
  type="number"
  formControlName="temperature"
  min="94"
  max="108"
  step="0.1"
  inputmode="decimal"
/>
                <span matSuffix>°F</span>
               
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field curved-field">
                <mat-label>SpO₂</mat-label>
<mat-icon matPrefix class="cute-icon oxygen-icon">air</mat-icon>
                <input matInput type="number" formControlName="spo2" min="70" max="100">
                <span matSuffix>%</span>
                
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field curved-field">
                <mat-label>Respiratory Rate</mat-label>
<mat-icon matPrefix class="cute-icon resp-icon">lungs</mat-icon>
                <input matInput type="number" formControlName="respiratoryRate" min="8" max="60">
                <span matSuffix>breaths/min</span>
                
              </mat-form-field>
            </div>

            <!-- Blood Sugar -->
            <h3 class="section-title">Blood Sugar</h3>
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field half-width">
                <mat-label>Blood Sugar</mat-label>
<mat-icon matPrefix class="cute-icon sugar-icon">bloodtype</mat-icon>
                <input matInput type="number" formControlName="bloodSugarValue" min="30" max="600">
                <span matSuffix>mg/dL</span>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field half-width">
                <mat-label>Type</mat-label>
<mat-icon matPrefix class="cute-icon sugar-icon">science</mat-icon>
                <mat-select formControlName="bloodSugarType">
                  <mat-option value="Random">Random</mat-option>
                  <mat-option value="Fasting">Fasting</mat-option>
                  <mat-option value="Postprandial">Postprandial</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Remarks -->
            <h3 class="section-title">Additional Information</h3>
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Remarks</mat-label>
<mat-icon matPrefix class="cute-icon remark-icon">notes</mat-icon>
              <textarea matInput formControlName="remarks" rows="3" 
                placeholder="Enter any additional observations, symptoms, or notes..."></textarea>
            </mat-form-field>

            <!-- Quick Templates -->
            <div class="template-section">
              <h3 class="section-title">Quick Templates</h3>
              <div class="template-buttons">
                <button mat-stroked-button type="button" (click)="applyTemplate('normal')">
                  <mat-icon>person</mat-icon>
                  Normal Adult
                </button>
                <button mat-stroked-button type="button" (click)="applyTemplate('fever')">
                  <mat-icon>thermostat</mat-icon>
                  Fever Pattern
                </button>
                <button mat-stroked-button type="button" (click)="applyTemplate('hypertension')">
                  <mat-icon>favorite</mat-icon>
                  Hypertension
                </button>
              </div>
            </div>

            <!-- Form Status Indicators -->
            <div class="form-status" *ngIf="showAbnormalIndicators()">
              <h3 class="section-title">Alerts</h3>
              <div class="alert-container">
                <div *ngFor="let alert of getAbnormalAlerts()" class="alert-item" [ngClass]="alert.class">
                  <mat-icon>{{ alert.icon }}</mat-icon>
                  <span>{{ alert.message }}</span>
                </div>
              </div>
            </div>

            <!-- Submit Buttons -->
            <div class="form-actions">
              <button mat-button type="button" (click)="cancel()">
                <mat-icon>arrow_back</mat-icon>
                Cancel
              </button>
              <button mat-raised-button color="primary" type="submit" 
                [disabled]="vitalsForm.invalid || isLoading">
                <mat-icon>{{ isLoading ? 'hourglass_empty' : 'check_circle' }}</mat-icon>
                {{ isLoading ? 'Recording...' : 'Record Vitals' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div *ngIf="isLoading" class="loading-overlay">
        <div class="loading-content">
          <mat-spinner diameter="50" class="spinner"></mat-spinner>
          <div class="loading-text">Recording Vitals...</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .vitals-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .patient-header {
      margin-bottom: 20px;
background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);      color: white;
    }

    .patient-info {
      display: flex;
      flex-wrap: wrap;
      gap: 30px;
      padding: 20px;
    }

    .info-row {
      display: flex;
      flex-direction: column;
    }

    .label {
      font-size: 12px;
      opacity: 0.8;
      margin-bottom: 4px;
    }

    .value {
      font-size: 16px;
      font-weight: 500;
    }
/* Fully rounded modern outline */
.curved-field .mdc-notched-outline__leading,
.curved-field .mdc-notched-outline__trailing {
  border-radius: 20px !important;
}

.curved-field .mdc-text-field {
  border-radius: 20px !important;
}

/* Soft focus glow */
.curved-field.mat-focused .mdc-notched-outline {
  box-shadow: 0 0 0 3px rgba(30, 60, 114, 0.15);
}
    .token-badge {
      background: white;
      color: #3f51b5;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: bold;
    }

    .vitals-form-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      padding: 30px;
      margin-bottom: 40px;
    }
/* Base icon style */
.field-icon {
  margin-right: 8px;
  font-size: 20px;
}

/* Cute base icon */
.cute-icon {
  font-size: 18px;
  padding: 6px;
  margin-right: 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

/* Height */
.height-icon {
  background: linear-gradient(135deg, #e3f2fd, #fce4ec);
  color: #5c6bc0;
}

/* Weight */
.weight-icon {
  background: linear-gradient(135deg, #f3e5f5, #e8eaf6);
  color: #7e57c2;
}

/* Heart / BP */
.heart-icon {
  background: linear-gradient(135deg, #ffe0e0, #fff3e0);
  color: #ec407a;
}

/* Pulse */
.pulse-icon {
  background: linear-gradient(135deg, #fce4ec, #f8bbd0);
  color: #d81b60;
}

/* Temperature */
.temp-icon {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  color: #fb8c00;
}

/* Oxygen */
.oxygen-icon {
  background: linear-gradient(135deg, #e0f7fa, #e1f5fe);
  color: #00acc1;
}

/* Respiratory */
.resp-icon {
  background: linear-gradient(135deg, #e8f5e9, #e0f2f1);
  color: #26a69a;
}

/* Sugar */
.sugar-icon {
  background: linear-gradient(135deg, #ede7f6, #f3e5f5);
  color: #8e24aa;
}

/* Remarks */
.remark-icon {
  background: linear-gradient(135deg, #eceff1, #f5f5f5);
  color: #546e7a;
}

/* Hover effect */
.form-field:hover .cute-icon {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
    .form-header {
      margin-bottom: 30px;
    }

    .form-header h2 {
      margin: 0;
      color: #3f51b5;
      font-size: 28px;
    }

    .subtitle {
      color: #666;
      margin-top: 8px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 500;
      margin: 30px 0 20px 0;
      color: #3f51b5;
      border-bottom: 2px solid #3f51b5;
      padding-bottom: 8px;
    }

.measurement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

    .form-field {
      width: 100%;
    }

    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }

    .half-width {
      flex: 1;
    }

    .full-width {
      width: 100%;
    }

    .bmi-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #3f51b5;
    }

    .bmi-label {
      font-size: 12px;
      color: #666;
      display: block;
      margin-bottom: 4px;
    }

    .bmi-value {
      font-size: 28px;
      font-weight: bold;
    }

    .bmi-category {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    .bmi-underweight { color: #ff9800; }
    .bmi-normal { color: #4caf50; }
    .bmi-overweight { color: #ff9800; }
    .bmi-obese { color: #f44336; }

    .template-section {
      margin-bottom: 30px;
    }

    .template-buttons {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .template-buttons button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .form-status {
      margin-bottom: 30px;
    }

    .alert-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 15px;
      border-radius: 8px;
      font-size: 14px;
      animation: pulse 2s infinite;
    }

    .alert-item.warning {
      background: #fff3cd;
      color: #856404;
      border-left: 4px solid #ff9800;
    }

    .alert-item.danger {
      background: #f8d7da;
      color: #721c24;
      border-left: 4px solid #f44336;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-content {
      background: white;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }

    .loading-text {
      margin-top: 20px;
      color: #333;
      font-weight: 500;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.8; }
      100% { opacity: 1; }
    }

    @media (max-width: 768px) {
      .patient-info {
        flex-direction: column;
        gap: 15px;
      }

      .measurement-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        flex-direction: column;
      }

      .template-buttons {
        flex-direction: column;
      }

      .form-actions {
        flex-direction: column;
        gap: 15px;
      }
    }
  `]
})
export class VitalsEntryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private vitalsService = inject(VitalsService);
  private visitService = inject(VisitService);
  private snackBar = inject(MatSnackBar);

  vitalsForm!: FormGroup;
  visit: any = null;
  calculatedBMI: number = 0;
  isLoading = false;
  isEditing = false;
  existingVitalsId?: string;
activeTemplate: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadVisitData();
    this.calculateBMI();
  }

// In vitals-entry.component.ts - Update initForm method
private initForm(): void {
  this.vitalsForm = this.fb.group({
    height: ['', [Validators.required, Validators.min(50), Validators.max(250)]],
    weight: ['', [Validators.required, Validators.min(2), Validators.max(300)]],
    // Remove required validator from all other fields
    bpSystolic: ['', [Validators.min(50), Validators.max(250)]],
    bpDiastolic: ['', [Validators.min(30), Validators.max(150)]],
    pulse: ['', [Validators.min(30), Validators.max(200)]],
temperature: ['', [Validators.min(94), Validators.max(108)]],
    spo2: ['', [Validators.min(70), Validators.max(100)]],
    respiratoryRate: ['', [Validators.min(8), Validators.max(60)]],
    bloodSugarValue: ['', [Validators.min(30), Validators.max(600)]],
    bloodSugarType: ['Random'],
    remarks: ['']
  });

  // Calculate BMI when height or weight changes
  this.vitalsForm.valueChanges.subscribe(() => {
    this.calculateBMI();
  });
}
  private calculateBMI(): void {
    const height = this.vitalsForm.get('height')?.value;
    const weight = this.vitalsForm.get('weight')?.value;
    
    if (height && weight) {
      const heightInMeters = height / 100;
      this.calculatedBMI = weight / (heightInMeters * heightInMeters);
    } else {
      this.calculatedBMI = 0;
    }
  }

  getPatientName(visit: any): string {
    return visit?.patient?.fullName || 
           visit?.patientId?.fullName || 
           'Unknown Patient';
  }

  getPatientAge(visit: any): any {
    return visit?.patient?.age || 
           visit?.patientId?.age || 
           'N/A';
  }

  getPatientGender(visit: any): string {
    return visit?.patient?.gender || 
           visit?.patientId?.gender || 
           'N/A';
  }

  getDoctorName(visit: any): string {
    return visit?.doctor?.name || 
           visit?.doctorId?.name || 
           visit?.doctorName || 
           'Not Assigned';
  }

  getBMIClass(bmi: number): string {
    if (bmi < 18.5) return 'bmi-underweight';
    if (bmi < 25) return 'bmi-normal';
    if (bmi < 30) return 'bmi-overweight';
    return 'bmi-obese';
  }

  getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  private loadVisitData(): void {
    const visitId = this.route.snapshot.paramMap.get('visitId');
    if (visitId) {
      this.isLoading = true;
      
      // Load visit details
      this.visitService.getVisitById(visitId).subscribe({
        next: (response) => {
          if (response.success) {
            this.visit = response.data;
            
            // Check if vitals already exist
            this.checkExistingVitals(visitId);
          } else {
            this.showError('Error loading visit data');
          }
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

  private checkExistingVitals(visitId: string): void {
    this.vitalsService.getVitalsByVisit(visitId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.existingVitalsId = response.data._id;
          this.isEditing = true;
          this.patchFormWithExistingData(response.data);
          this.snackBar.open('Editing existing vitals record', 'Close', { duration: 3000 });
        }
      },
      error: () => {
        // No existing vitals, that's fine
      }
    });
  }

  private patchFormWithExistingData(vitals: any): void {
    this.vitalsForm.patchValue({
      height: vitals.height?.value || '',
      weight: vitals.weight?.value || '',
      bpSystolic: vitals.bloodPressure?.systolic || '',
      bpDiastolic: vitals.bloodPressure?.diastolic || '',
      pulse: vitals.pulse?.value || '',
      temperature: vitals.temperature?.value || '',
      spo2: vitals.spo2?.value || '',
      respiratoryRate: vitals.respiratoryRate?.value || '',
      bloodSugarValue: vitals.bloodSugar?.value || '',
      bloodSugarType: vitals.bloodSugar?.type || 'Random',
      remarks: vitals.remarks || ''
    });
  }

applyTemplate(templateName: string): void {

  // 🔁 If same template clicked again → CLEAR FORM
  if (this.activeTemplate === templateName) {
    this.vitalsForm.reset({
      bloodSugarType: 'Random'
    });
    this.calculatedBMI = 0;
    this.activeTemplate = null;
    return;
  }

  // Otherwise apply template
  this.activeTemplate = templateName;

  const templates: any = {
    normal: {
      height: 170,
      weight: 70,
      bpSystolic: 120,
      bpDiastolic: 80,
      pulse: 72,
      temperature: 98.6, // Fahrenheit
      spo2: 98,
      respiratoryRate: 16,
      bloodSugarValue: 110
    },
    fever: {
      temperature: 101.3, // Fahrenheit
      pulse: 90,
      bpSystolic: 110,
      bpDiastolic: 70
    },
    hypertension: {
      bpSystolic: 150,
      bpDiastolic: 95,
      pulse: 78
    }
  };

  this.vitalsForm.patchValue(templates[templateName] || {});
}


  showAbnormalIndicators(): boolean {
    const form = this.vitalsForm.value;
    return this.checkHighBP(form.bpSystolic, form.bpDiastolic) ||
           this.checkHighTemperature(form.temperature) ||
           this.checkLowSpO2(form.spo2) ||
           this.checkAbnormalPulse(form.pulse);
  }

  getAbnormalAlerts(): any[] {
    const form = this.vitalsForm.value;
    const alerts = [];

    if (this.checkHighBP(form.bpSystolic, form.bpDiastolic)) {
      alerts.push({
        icon: 'favorite',
        message: `High Blood Pressure (${form.bpSystolic}/${form.bpDiastolic} mmHg)`,
        class: 'danger'
      });
    }

    if (this.checkHighTemperature(form.temperature)) {
      alerts.push({
        icon: 'thermostat',
        message: `Fever Detected (${form.temperature}°F)`,
        class: 'danger'
      });
    }

    if (this.checkLowSpO2(form.spo2)) {
      alerts.push({
        icon: 'air',
        message: `Low Oxygen Saturation (${form.spo2}%)`,
        class: 'warning'
      });
    }

    if (this.checkAbnormalPulse(form.pulse)) {
      alerts.push({
        icon: 'favorite_border',
        message: `Abnormal Pulse Rate (${form.pulse} bpm)`,
        class: 'warning'
      });
    }

    return alerts;
  }

  checkHighBP(systolic: number, diastolic: number): boolean {
    return systolic > 140 || diastolic > 90;
  }

  checkHighTemperature(temp: number): boolean {
    return temp > 100.4;
  }

  checkLowSpO2(spo2: number): boolean {
    return spo2 < 95;
  }

  checkAbnormalPulse(pulse: number): boolean {
    return pulse < 60 || pulse > 100;
  }

onSubmit(): void {
  // Only check if form is valid based on required fields
  if (this.vitalsForm.get('height')?.invalid || this.vitalsForm.get('weight')?.invalid) {
    this.markFormGroupTouched(this.vitalsForm);
    return;
  }

  this.isLoading = true;
  
  const formValue = this.vitalsForm.value;
  
  // Create a properly typed vitalsData object
  const vitalsData: any = {
    visitId: this.visit._id,
    height: formValue.height,
    weight: formValue.weight
  };

  // Add optional fields only if they have values
  if (formValue.bpSystolic && formValue.bpDiastolic) {
    vitalsData.bloodPressure = {
      systolic: formValue.bpSystolic,
      diastolic: formValue.bpDiastolic
    };
  }

  if (formValue.pulse) vitalsData.pulse = formValue.pulse;
  if (formValue.temperature) vitalsData.temperature = formValue.temperature;
  if (formValue.spo2) vitalsData.spo2 = formValue.spo2;
  if (formValue.respiratoryRate) vitalsData.respiratoryRate = formValue.respiratoryRate;
  
  if (formValue.bloodSugarValue) {
    vitalsData.bloodSugar = {
      value: formValue.bloodSugarValue,
      type: formValue.bloodSugarType
    };
  }
  
  if (formValue.remarks) vitalsData.remarks = formValue.remarks;

  if (this.isEditing && this.existingVitalsId) {
    // Update existing vitals
    this.vitalsService.updateVitals(this.existingVitalsId, vitalsData).subscribe({
      next: (response) => {
        this.handleSuccess('Vitals updated successfully!');
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  } else {
    // Create new vitals
    this.vitalsService.recordVitals(vitalsData).subscribe({
      next: (response) => {
        this.handleSuccess('Vitals recorded successfully!');
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }
}
  private handleSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });

    // Navigate back to nurse dashboard after a short delay
    setTimeout(() => {
      window.history.back();
    }, 1500);
  }

  private handleError(error: any): void {
    console.error('Error recording vitals:', error);
    this.snackBar.open(
      error.error?.message || 'Error recording vitals. Please try again.',
      'Close',
      {
        duration: 5000,
        panelClass: ['error-snackbar']
      }
    );
    this.isLoading = false;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  cancel(): void {
    window.history.back();
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}