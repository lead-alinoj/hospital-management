import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IpAdmissionService } from '../../service/ip-admission.service';
import { MatChipsModule } from "@angular/material/chips";
import { AuthService } from '../../auth/auth.service';
import { PatientService } from '../../service/patient.service'; // Add this
import { VisitService } from '../../service/visit.service'; // Add this
import { Router, ActivatedRoute } from '@angular/router'; // Add these
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Add this
import { MatRadioModule } from '@angular/material/radio'; // Add this

@Component({
  selector: 'app-ip-admission',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule, // Add this
    MatRadioModule // Add this
  ],
  template: `
    <div class="ip-admission-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            {{ isDoctorMode ? 'Doctor IP Recommendation' : 'Emergency IP Admission' }}
          </mat-card-title>
          <mat-card-subtitle>
            {{ isDoctorMode ? 'Recommend IP admission for patient' : 'Direct emergency admission' }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Loading State -->
          <div *ngIf="isLoading" class="loading-state">
            <mat-progress-spinner diameter="50" mode="indeterminate"></mat-progress-spinner>
            <p>Loading...</p>
          </div>

          <!-- Doctor Mode - Show Visit Info -->
          <div *ngIf="isDoctorMode && visit" class="patient-info">
            <h3>{{ visit.patient?.fullName }}</h3>
            <div class="patient-details">
              <span><strong>OP:</strong> {{ visit.patient?.opNumber }}</span>
              <span><strong>Age:</strong> {{ visit.patient?.age }}Y</span>
              <span><strong>Gender:</strong> {{ visit.patient?.gender }}</span>
              <span><strong>Token:</strong> {{ visit.tokenNumber }}</span>
              <span><strong>Doctor:</strong> {{ visit.doctor?.name }}</span>
            </div>
            <div class="chief-complaint">
              <strong>Chief Complaint:</strong> {{ visit.chiefComplaint }}
            </div>
          </div>

          <!-- Reception Mode - Patient Selection -->
          <div *ngIf="!isDoctorMode" class="reception-mode">
            <!-- Patient Search and Selection -->
            <div class="patient-selection-section">
              <h3>Select Registered Patient</h3>
              
              <!-- Search Patient -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Search Patient</mat-label>
                <input matInput 
                  [(ngModel)]="searchQuery" 
                  (input)="searchPatients()" 
                  placeholder="Search by name, OP number, or mobile">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <!-- Patient List -->
              <div *ngIf="patients.length > 0" class="patient-list">
                <mat-radio-group [(ngModel)]="selectedPatientId" class="patient-radio-group">
                  <div *ngFor="let patient of patients" 
                       class="patient-option"
                       (click)="selectPatient(patient)">
                    <mat-radio-button [value]="patient._id">
                      <div class="patient-display">
                        <div class="patient-name">{{ patient.fullName }}</div>
                        <div class="patient-details">
                          <span>OP: {{ patient.opNumber }}</span>
                          <span>Mobile: {{ patient.mobile }}</span>
                          <span>Age: {{ patient.age }}Y</span>
                          <span>Gender: {{ patient.gender }}</span>
                          <span *ngIf="patient.bloodGroup">Blood Group: {{ patient.bloodGroup }}</span>
                        </div>
                      </div>
                    </mat-radio-button>
                  </div>
                </mat-radio-group>
              </div>

              <div *ngIf="patients.length === 0 && searchQuery" class="no-patients">
                <mat-icon>person_off</mat-icon>
                <p>No patients found matching "{{ searchQuery }}"</p>
              </div>

              <div *ngIf="patients.length === 0 && !searchQuery" class="no-patients">
                <mat-icon>people</mat-icon>
                <p>Start typing to search for patients</p>
              </div>
            </div>

            <!-- Selected Patient Info -->
            <div *ngIf="selectedPatient" class="selected-patient-info">
              <h4>Selected Patient</h4>
              <div class="patient-card">
                <div class="patient-header">
                  <span class="patient-name">{{ selectedPatient.fullName }}</span>
                  <span class="patient-op">OP: {{ selectedPatient.opNumber }}</span>
                </div>
                <div class="patient-body">
                  <div class="patient-row">
                    <span><strong>Mobile:</strong> {{ selectedPatient.mobile }}</span>
                    <span><strong>Age:</strong> {{ selectedPatient.age }}Y</span>
                    <span><strong>Gender:</strong> {{ selectedPatient.gender }}</span>
                  </div>
                  <div class="patient-row">
                    <span><strong>Blood Group:</strong> {{ selectedPatient.bloodGroup || 'Not specified' }}</span>
                    <span><strong>Patient Type:</strong> {{ selectedPatient.patientType || 'OP' }}</span>
                  </div>
                  <div *ngIf="selectedPatient.address" class="patient-address">
                    <strong>Address:</strong> {{ getFullAddress(selectedPatient.address) }}
                  </div>
                  <div *ngIf="selectedPatient.emergencyContact?.name" class="emergency-contact">
                    <strong>Emergency Contact:</strong> {{ selectedPatient.emergencyContact.name }} 
                    ({{ selectedPatient.emergencyContact.relation }}) - {{ selectedPatient.emergencyContact.mobile }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Bed Availability -->
            <div *ngIf="selectedPatient" class="bed-section">
              <h3>Select Bed</h3>
              
              <div *ngIf="availableBeds.length > 0" class="bed-availability-section">
                <div class="bed-grid">
                  <div *ngIf="groupedBeds">
                    <div *ngFor="let group of getGroupedBedsArray()" class="care-unit-section">
                      <h4>{{ group.unit.name }} ({{ group.unit.category }})</h4>
                      <div class="bed-list">
                        <mat-card *ngFor="let bed of group.beds" 
                          class="bed-card"
                          [class.selected]="selectedBed?._id === bed._id"
                          (click)="selectBed(bed)">
                          <mat-card-content>
                            <div class="bed-info">
                              <mat-icon>hotel</mat-icon>
                              <span class="bed-number">{{ bed.bedNumber }}</span>
                            </div>
                            <div class="unit-info">{{ bed.careUnit.unitNumber }}</div>
                          </mat-card-content>
                        </mat-card>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="availableBeds.length === 0 && !loadingBeds" class="no-beds">
                <mat-icon>hotel</mat-icon>
                <p>No beds available at the moment</p>
              </div>

              <div *ngIf="loadingBeds" class="loading-beds">
                <mat-progress-spinner diameter="30" mode="indeterminate"></mat-progress-spinner>
                <p>Loading beds...</p>
              </div>
            </div>
          </div>

          <!-- Admission Form -->
          <form [formGroup]="admissionForm" 
                *ngIf="(isDoctorMode && visit) || (!isDoctorMode && selectedBed && selectedPatient)">
            
            <!-- Doctor Mode Fields -->
            <div *ngIf="isDoctorMode" class="doctor-fields">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Admission Type</mat-label>
                <mat-select formControlName="admissionType">
                  <mat-option value="DOCTOR_ADVISED">Doctor Advised</mat-option>
                  <mat-option value="OBSERVATION">Observation</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width" 
                *ngIf="admissionForm.get('admissionType')?.value === 'OBSERVATION'">
                <mat-label>Observation End Time</mat-label>
                <input matInput type="datetime-local" formControlName="observationEndTime">
              </mat-form-field>
            </div>

            <!-- Reception Mode Fields -->
            <div *ngIf="!isDoctorMode" class="reception-fields">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Admission Type</mat-label>
                <mat-select formControlName="admissionType" [disabled]="true">
                  <mat-option value="EMERGENCY">Emergency</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Common Fields -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Admission Reason *</mat-label>
              <textarea matInput formControlName="admissionReason" rows="3"
                placeholder="Clinical justification for admission..." required></textarea>
              <mat-error *ngIf="admissionForm.get('admissionReason')?.hasError('required')">
                Admission reason is required
              </mat-error>
            </mat-form-field>

            <!-- Clinical Notes (Doctor Only) -->
            <mat-form-field *ngIf="isDoctorMode" appearance="outline" class="full-width">
              <mat-label>Clinical Notes</mat-label>
              <textarea matInput formControlName="clinicalNotes" rows="3"
                placeholder="Additional clinical findings..."></textarea>
            </mat-form-field>

            <!-- Emergency Contact Info (Reception Only) -->
            <div *ngIf="!isDoctorMode && selectedPatient" class="emergency-contact-section">
              <h4>Emergency Contact Information</h4>
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Contact Name</mat-label>
                  <input matInput [value]="selectedPatient.emergencyContact?.name || ''" disabled>
                </mat-form-field>
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Contact Mobile</mat-label>
                  <input matInput [value]="selectedPatient.emergencyContact?.mobile || ''" disabled>
                </mat-form-field>
              </div>
            </div>

          </form>

          <!-- Doctor Mode - No Bed Selection Message -->
          <div *ngIf="isDoctorMode" class="info-message">
            <mat-icon>info</mat-icon>
            <p>This recommendation will be sent to the IP Dashboard. Reception will allocate the bed.</p>
          </div>

        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button (click)="cancel()">Cancel</button>
         <button
  mat-raised-button
  type="button"
  color="primary"
  [disabled]="isDoctorMode ? (!visit || admissionForm.invalid) : (!selectedBed || !selectedPatient || admissionForm.invalid)"
  (click)="processAdmission()">

            <mat-icon>check</mat-icon>
            {{ isDoctorMode ? 'Recommend Admission' : 'Admit Patient' }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .ip-admission-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .loading-state {
      text-align: center;
      padding: 40px;
    }
    
    .reception-mode {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }
    
    .patient-selection-section {
      margin-bottom: 20px;
    }
    
    .patient-list {
      max-height: 400px;
      overflow-y: auto;
      margin-top: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 10px;
    }
    
    .patient-radio-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .patient-option {
      padding: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .patient-option:hover {
      background-color: #f5f5f5;
    }
    
    .patient-option.mat-radio-checked {
      background-color: #e3f2fd;
      border-color: #1976d2;
    }
    
    .patient-display {
      margin-left: 10px;
    }
    
    .patient-name {
      font-weight: 600;
      font-size: 16px;
      color: #333;
      margin-bottom: 5px;
    }
    
    .patient-details {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      font-size: 14px;
      color: #666;
    }
    
    .patient-details span {
      padding: 2px 8px;
      background: #f0f0f0;
      border-radius: 4px;
    }
    
    .no-patients {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    
    .selected-patient-info {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    }
    
    .patient-card {
      margin-top: 10px;
    }
    
    .patient-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .patient-name {
      font-size: 18px;
      font-weight: 600;
    }
    
    .patient-op {
      background: #2196f3;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
    }
    
    .patient-body {
      font-size: 14px;
    }
    
    .patient-row {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 10px;
    }
    
    .patient-address, .emergency-contact {
      margin-top: 10px;
      padding: 10px;
      background: white;
      border-radius: 4px;
    }
    
    .bed-section {
      margin-top: 20px;
    }
    
    .bed-availability-section {
      margin-bottom: 20px;
    }
    
    .bed-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .care-unit-section {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
    }
    
    .bed-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
    }
    
    .bed-card {
      width: 120px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .bed-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .bed-card.selected {
      border: 2px solid #1976d2;
      background: #e3f2fd;
    }
    
    .bed-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 5px;
    }
    
    .bed-number {
      font-size: 18px;
      font-weight: bold;
    }
    
    .unit-info {
      font-size: 12px;
      color: #666;
    }
    
    .no-beds {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    
    .loading-beds {
      text-align: center;
      padding: 20px;
    }
    
    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .full-width { width: 100%; }
    .half-width { flex: 1; }
    
    .info-message {
      text-align: center;
      padding: 20px;
      background: #e3f2fd;
      border-radius: 8px;
      margin-top: 20px;
      color: #1976d2;
    }
    
    .patient-info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .patient-details {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin: 10px 0;
    }
    
    .patient-details span {
      background: white;
      padding: 4px 12px;
      border-radius: 4px;
    }
    
    .chief-complaint {
      margin-top: 10px;
      padding: 10px;
      background: #fff3cd;
      border-radius: 4px;
    }
    
    .emergency-contact-section {
      background: #fff9e6;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
    
    .doctor-fields, .reception-fields {
      margin-bottom: 20px;
    }
  `]
})
export class IpAdmissionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ipService = inject(IpAdmissionService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private patientService = inject(PatientService);
  private visitService = inject(VisitService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  admissionForm!: FormGroup;
  availableBeds: any[] = [];
  groupedBeds: any = {};
  selectedBed: any = null;
  
  // Patient selection for reception
  patients: any[] = [];
  searchQuery: string = '';
  selectedPatientId: string = '';
  selectedPatient: any = null;
  
  // For doctor mode
  visit: any = null;
  visitId: string = '';
  isDoctorMode: boolean = false;
  
  // Loading states
  isLoading: boolean = false;
  loadingBeds: boolean = false;
  searchingPatients: boolean = false;

  ngOnInit() {
    this.initForm();
    this.checkMode();
    this.loadBedAvailability();
  }

  private checkMode() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as any;
    
    if (state && state.source === 'DOCTOR' && state.visitId) {
      this.isDoctorMode = true;
      this.visitId = state.visitId;
      this.loadVisit();
    } else {
      this.isDoctorMode = false;
    }
  }

 private initForm() {
  this.admissionForm = this.fb.group({
    admissionReason: ['', Validators.required],
    admissionType: [{ value: 'EMERGENCY', disabled: true }],
    observationEndTime: [''],
    clinicalNotes: ['']
  });
}


  private loadVisit() {
    if (!this.visitId) return;
    
    this.isLoading = true;
    this.visitService.getVisitById(this.visitId).subscribe({
      next: (res: any) => {
        this.visit = res.data || res;
        this.isLoading = false;
      },
      error: (err) => {
        this.showError('Error loading visit');
        this.isLoading = false;
      }
    });
  }

  private loadBedAvailability() {
    this.loadingBeds = true;
    this.ipService.getBedAvailability().subscribe({
      next: (res: any) => {
       this.groupedBeds = res.data.groupedBeds || {};

// 🔥 build availableBeds from groupedBeds
this.availableBeds = Object.values(this.groupedBeds)
  .flatMap((group: any) => group.beds || []);

        this.loadingBeds = false;
      },
      error: (err) => {
        this.showError('Error loading bed availability');
        this.loadingBeds = false;
      }
    });
  }

  searchPatients() {
    if (!this.searchQuery.trim()) {
      this.patients = [];
      return;
    }

    this.searchingPatients = true;
    
    this.patientService.searchPatients(this.searchQuery, 1, 10).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.patients = res.data || [];
        } else {
          this.patients = [];
        }
        this.searchingPatients = false;
      },
      error: (err) => {
        this.showError('Error searching patients');
        this.patients = [];
        this.searchingPatients = false;
      }
    });
  }

  selectPatient(patient: any) {
    this.selectedPatient = patient;
    this.selectedPatientId = patient._id;
    
    // Auto-select first available bed if any
    if (this.availableBeds.length > 0 && !this.selectedBed) {
      this.selectedBed = this.availableBeds[0];
    }
  }

  selectBed(bed: any) {
    this.selectedBed = bed;
  }

  getGroupedBedsArray(): any[] {
    if (!this.groupedBeds) return [];
    
    return Object.entries(this.groupedBeds).map(([key, value]: [string, any]) => ({
      key,
      unit: value.unit,
      beds: value.beds
    }));
  }

  getFullAddress(address: any): string {
    if (!address) return 'Not specified';
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`;
  }

  processAdmission() {
    if (this.isDoctorMode) {
      this.doctorRecommendation();
    } else {
      this.emergencyAdmission();
    }
  }

  private doctorRecommendation() {
    if (!this.visit || this.admissionForm.invalid) return;

const recommendationData = {
  visitId: this.visit._id,
  admissionType: this.admissionForm.get('admissionType')?.value,
  admissionReason: this.admissionForm.get('admissionReason')?.value,
  clinicalNotes: this.admissionForm.get('clinicalNotes')?.value,
  observationEndTime: this.admissionForm.get('observationEndTime')?.value,
  status: 'RECOMMENDED',
  admissionNotes: this.admissionForm.get('clinicalNotes')?.value
};


    this.isLoading = true;
    this.ipService.doctorAdvisedAdmission(recommendationData).subscribe({
      next: () => {
        this.showSuccess('IP admission recommended successfully');
        this.router.navigate(['/doctor/dashboard']);
      },
      error: (err) => {
        this.showError(err.error?.message || 'Recommendation failed');
        this.isLoading = false;
      }
    });
  }

 private emergencyAdmission() {
  if (!this.selectedPatient || !this.selectedBed || this.admissionForm.invalid) {
    this.showError('Please select patient, bed, and enter admission reason');
    return;
  }

  const admissionData = {
    patientId: this.selectedPatient._id,
    bedId: this.selectedBed._id,
    admissionReason: this.admissionForm.get('admissionReason')?.value,
    shift: this.getCurrentShift()
  };

  this.isLoading = true;

  this.ipService.emergencyAdmission(admissionData).subscribe({
    next: () => {
      this.showSuccess('Patient admitted successfully');
      this.router.navigate(['/ip-dashboard']);
    },
    error: (err) => {
      this.showError(err.error?.message || 'Emergency admission failed');
      this.isLoading = false;
    }
  });
}


  private getCurrentShift(): string {
    const hour = new Date().getHours();
    return hour < 12 ? 'Morning' : 'Evening';
  }

  cancel() {
    if (this.isDoctorMode) {
      this.router.navigate(['/doctor/dashboard']);
    } else {
      this.router.navigate(['/reception/dashboard']);
    }
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}