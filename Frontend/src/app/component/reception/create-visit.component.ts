import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PatientService } from '../../service/patient.service';
import { VisitService } from '../../service/visit.service';
import { Patient } from '../../models/patient.model';
import { FormControl } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { PatientSearchComponent } from './patient-search.component';

@Component({
  selector: 'app-create-visit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule
  ],
  template: `
    <div class="create-visit-wrapper">
      <div class="create-visit-container">
        <form [formGroup]="visitForm" (ngSubmit)="onSubmit()">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Create New Visit</mat-card-title>
              <mat-card-subtitle>Register patient visit and assign doctor</mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <!-- Patient Search Section -->
              <div class="patient-search-section">
                <h3 class="section-title">Patient Selection</h3>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Search Patient (Name / Mobile / OP No)</mat-label>
                  <mat-icon matPrefix>person_search</mat-icon>
                  
                  <input matInput
                         [formControl]="patientSearchControl"
                         [matAutocomplete]="auto"
                         [disabled]="!!selectedPatient"
                         placeholder="Type to search patients...">

                  <button mat-icon-button matSuffix *ngIf="selectedPatient" (click)="clearPatient()" aria-label="Clear patient">
                    <mat-icon>close</mat-icon>
                  </button>
                  
                  <mat-autocomplete #auto="matAutocomplete"
                                   [displayWith]="displayPatient"
                                   (optionSelected)="selectPatient($event.option.value)">
                    <mat-option *ngFor="let p of filteredPatients" [value]="p">
                      <div class="patient-option">
                        <span class="patient-name">{{ p.fullName }}</span>
                        <span class="patient-details">{{ p.mobile }} • OP: {{ p.opNumber }}</span>
                      </div>
                    </mat-option>
                  </mat-autocomplete>
                </mat-form-field>

                <!-- Selected Patient Info -->
                <div *ngIf="selectedPatient" class="selected-patient-card">
                  <div class="patient-info-header">
                    <mat-icon>person</mat-icon>
                    <h4>Selected Patient</h4>
                  </div>
                  <div class="patient-info-grid">
                    <div class="info-item">
                      <span class="info-label">Name:</span>
                      <span class="info-value">{{ selectedPatient.fullName }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Mobile:</span>
                      <span class="info-value">{{ selectedPatient.mobile }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">OP Number:</span>
                      <span class="info-value">{{ selectedPatient.opNumber }}</span>
                    </div>
                    <div class="info-item" *ngIf="selectedPatient.gender">
                      <span class="info-label">Gender:</span>
                      <span class="info-value">{{ selectedPatient.gender }}</span>
                    </div>
                  </div>
                </div>

                <div *ngIf="!selectedPatient" class="patient-placeholder">
                  <mat-icon>person_add</mat-icon>
                  <p>Search and select a patient to continue</p>
                </div>
              </div>

              <!-- Doctor Assignment Section -->
              <div class="form-section">
                <h3 class="section-title">Assign Doctor</h3>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Select Doctor</mat-label>
                  <mat-icon matPrefix>medical_services</mat-icon>
                  <mat-select formControlName="doctorId" required>
                    <mat-option *ngFor="let doctor of availableDoctors" [value]="doctor._id">
                      {{ getDoctorDisplayName(doctor) }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="visitForm.get('doctorId')?.hasError('required')">
                    Please select a doctor
                  </mat-error>
                </mat-form-field>
              </div>

              <!-- Visit Details Section -->
              <div class="form-section">
                <h3 class="section-title">Visit Details</h3>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Chief Complaint</mat-label>
                  <textarea matInput formControlName="chiefComplaint" 
                    placeholder="Brief description of symptoms" rows="3"></textarea>
                </mat-form-field>

                <div class="form-grid">
                  <div class="form-group">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Priority</mat-label>
                      <mat-select formControlName="priority">
                        <mat-option value="Normal">Normal</mat-option>
                        <mat-option value="High">High Priority</mat-option>
                        <mat-option value="Emergency">Emergency</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="form-group">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Visit Type</mat-label>
                      <mat-select formControlName="visitType" required>
                        <mat-option value="OP">Out Patient (OP)</mat-option>
                        <mat-option value="IP">In Patient (IP)</mat-option>
                        <mat-option value="Emergency">Emergency</mat-option>
                        <mat-option value="FollowUp">Follow-up Visit</mat-option>
                      </mat-select>
                      <mat-error *ngIf="visitForm.get('visitType')?.hasError('required')">
                        Visit Type is required
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="form-group">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Shift</mat-label>
                      <mat-select formControlName="shift" required>
                        <mat-option value="Morning">Morning</mat-option>
                        <mat-option value="Evening">Evening</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>
              </div>
            </mat-card-content>

            <!-- Form Actions -->
            <mat-card-actions align="end">
              <button mat-button type="button" [routerLink]="['/reception/dashboard']" class="cancel-btn">
                Cancel
              </button>
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="visitForm.invalid || isLoading || !selectedPatient"
                      class="submit-btn">
                <mat-icon *ngIf="!isLoading">add_circle</mat-icon>
                {{ isLoading ? 'Creating...' : 'Create Visit' }}
              </button>
            </mat-card-actions>
          </mat-card>
        </form>
      </div>
    </div>
  `,
  styles: [`
    /* Main wrapper with light blue background */
    .create-visit-wrapper {
      min-height: 100vh;
      background: linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%);
      padding: 16px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }

    /* Main container */
    .create-visit-container {
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
    }

    /* Material Card */
    mat-card {
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      margin-bottom: 20px;
    }

    mat-card-header {
      background: linear-gradient(90deg, #489bee 0%, #2196f3 100%);
      color: white;
      padding: 8px;
      border-radius: 16px 16px 0 0;
    }

    mat-card-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    mat-card-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
    }

    mat-card-content {
      padding: 24px;
    }
    
    mat-card-actions {
      padding: 16px 24px;
      background: #fafafa;
      border-top: 1px solid #eee;
    }

    /* Form sections */
    .patient-search-section,
    .form-section {
      margin-bottom: 32px;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      border: 1px solid #e0e0e0;
    }

    .section-title {
      color: #1976d2;
      margin: 0 0 20px 0;
      font-size: 1.2rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Form fields */
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    mat-form-field {
      margin-bottom: 16px;
    }
mat-icon {
      color: #1976d2;
    }
    /* Patient option styling */
    .patient-option {
      display: flex;
      flex-direction: column;
      padding: 8px 0;
    }

    .patient-name {
      font-weight: 500;
      color: #333;
    }

    .patient-details {
      font-size: 0.85rem;
      color: #666;
      margin-top: 2px;
    }

    /* Selected patient card */
    .selected-patient-card {
      background: #e8f4fd;
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
      border-left: 4px solid #1976d2;
    }

    .patient-info-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .patient-info-header mat-icon {
      color: #1976d2;
    }

    .patient-info-header h4 {
      margin: 0;
      color: #1976d2;
      font-weight: 600;
    }

    .patient-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 4px;
    }

    .info-value {
      font-weight: 500;
      color: #333;
    }

    /* Patient placeholder */
    .patient-placeholder {
      text-align: center;
      padding: 32px 16px;
      color: #666;
      border: 2px dashed #90caf9;
      border-radius: 8px;
      margin-top: 16px;
      background: #f8fdff;
    }

    .patient-placeholder mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 12px;
      color: #90caf9;
    }

    .patient-placeholder p {
      margin: 0;
      font-size: 0.95rem;
    }

    /* Form grid for responsive layout */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    /* Buttons */
    .cancel-btn {
      color: #666;
      margin-right: 12px;
    }

    .submit-btn {
      padding: 8px 24px;
      font-weight: 500;
      min-width: 140px;
    }

    .submit-btn mat-icon {
      margin-right: 8px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .create-visit-wrapper {
        padding: 12px;
      }

      .create-visit-container {
        padding: 0;
      }

      mat-card-content {
        padding: 16px;
      }

      .patient-search-section,
      .form-section {
        padding: 16px;
        margin-bottom: 24px;
      }

      mat-card-title {
        font-size: 1.3rem;
      }

      mat-card-subtitle {
        font-size: 0.85rem;
      }

      .patient-info-grid {
        grid-template-columns: 1fr;
      }

      .form-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .section-title {
        font-size: 1.1rem;
      }

      mat-card-actions {
        padding: 16px;
        flex-direction: column;
        gap: 12px;
      }

      .cancel-btn,
      .submit-btn {
        width: 100%;
        margin: 0;
      }
    }

    @media (max-width: 480px) {
      .create-visit-wrapper {
        padding: 8px;
      }

      mat-card-header {
        padding: 16px;
      }

      mat-card-title {
        font-size: 1.2rem;
      }

      .patient-search-section,
      .form-section {
        padding: 12px;
      }

      .patient-info-grid {
        gap: 8px;
      }

      .patient-placeholder {
        padding: 24px 12px;
      }

      .patient-placeholder mat-icon {
        font-size: 40px;
        height: 40px;
        width: 40px;
      }

      .submit-btn {
        min-width: 120px;
      }
    }

    /* Tablet Landscape */
    @media (min-width: 769px) and (max-width: 1024px) {
      .create-visit-container {
        max-width: 90%;
      }

      .form-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Desktop Large */
    @media (min-width: 1200px) {
      .create-visit-container {
        max-width: 1100px;
      }

      .form-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    /* Print styles */
    @media print {
      .create-visit-wrapper {
        background: white;
        padding: 0;
      }

      .cancel-btn {
        display: none;
      }
    }

    /* Accessibility improvements */
    mat-form-field:focus-within {
      // outline: 2px solid #1976d2;
      outline-offset: 2px;
      border-radius: 4px;
    }

    /* Loading state */
    :host-context([aria-busy="true"]) {
      opacity: 0.7;
    }
  `]
})
export class CreateVisitComponent implements OnInit {
  private fb = inject(FormBuilder);
  private visitService = inject(VisitService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private patientService = inject(PatientService);
  private router = inject(Router);

  patientSearchControl = new FormControl<Patient | string>('');
  filteredPatients: Patient[] = [];
  visitForm!: FormGroup;
  selectedPatient: Patient | null = null;
  availableDoctors: any[] = [];
  isLoading = false;
  todaysVisits: any[] = [];

  ngOnInit(): void {
    this.initForm();

    const nav = history.state;
    if (nav?.patient) {
      this.selectedPatient = nav.patient;
      this.visitForm.patchValue({ patientId: nav.patient._id });
      this.patientSearchControl.setValue(nav.patient);
    }

    this.loadAvailableDoctors();

    this.patientSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(value => {
          if (typeof value === 'string') {
            return this.patientService.searchPatients(value);
          }
          return this.patientService.searchPatients('');
        })
      )
      .subscribe((res: any) => {
        this.filteredPatients = res.data || [];
      });
  }

  getDoctorDisplayName(doctor: any): string {
    if (!doctor) return '';
    return `Dr ${doctor.name}${doctor.specialization ? ' - ' + doctor.specialization : ''}`;
  }

  private initForm(): void {
    this.visitForm = this.fb.group({
      patientId: ['', Validators.required],
      doctorId: ['', Validators.required],
      visitType: ['OP', Validators.required],
      chiefComplaint: [''],
      priority: ['Normal'],
      shift: ['Morning', Validators.required]
    });
  }

  private loadAvailableDoctors(): void {
    this.visitService.getDoctors().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.availableDoctors = response.data;
        } else {
          this.availableDoctors = [];
        }
      },
      error: (err) => {
        console.error('Error fetching doctors:', err);
        this.availableDoctors = [];
      }
    });
  }

  selectPatient(patient: Patient) {
    this.selectedPatient = patient;
    this.visitForm.patchValue({
      patientId: patient._id
    });
    this.patientSearchControl.setValue(patient);
  }

  displayPatient(patient: Patient): string {
    return patient 
      ? `${patient.fullName} | ${patient.mobile} | OP: ${patient.opNumber}`
      : '';
  }

  clearPatient(): void {
    this.selectedPatient = null;
    this.visitForm.patchValue({ patientId: '' });
    this.patientSearchControl.setValue('');
  }

  async onSubmit(): Promise<void> {
    if (this.visitForm.invalid || !this.selectedPatient) {
      this.snackBar.open('Please select a patient and fill all required fields', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    this.isLoading = true;
    
    try {
      const response = await this.visitService.createVisit(this.visitForm.value).toPromise();
      
      this.snackBar.open(response.message, 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });

      // Reset form
      this.visitForm.reset({
        priority: 'Normal',
        shift: 'Morning',
        visitType: 'OP'
      });
      this.selectedPatient = null;
      this.patientSearchControl.setValue('');
      
    } catch (error: any) {
      console.error('Error creating visit:', error);  
      this.snackBar.open(
        error.error?.message || error.message || 'Error creating visit', 
        'Close', 
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    } finally {
      this.isLoading = false;
    }
  }
}