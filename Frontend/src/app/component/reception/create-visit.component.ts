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
    <div class="create-visit-container">
<form [formGroup]="visitForm" (ngSubmit)="onSubmit()">
<mat-card>
        <mat-card-header>
          <mat-card-title>Create New Visit</mat-card-title>
          <mat-card-subtitle>Register patient visit and assign doctor</mat-card-subtitle>
        </mat-card-header>

<mat-form-field appearance="outline" class="full-width">
  <mat-label>Search Patient (Name / Mobile / OP No)</mat-label>

  <input matInput
         [formControl]="patientSearchControl"
         [matAutocomplete]="auto"
         [disabled]="!!selectedPatient">

  <button mat-icon-button matSuffix *ngIf="selectedPatient" (click)="clearPatient()">
    <mat-icon>close</mat-icon>
  </button>


 <mat-autocomplete #auto="matAutocomplete"
  [displayWith]="displayPatient"
  (optionSelected)="selectPatient($event.option.value)">


    <mat-option *ngFor="let p of filteredPatients" [value]="p">
      {{ p.fullName }} | {{ p.mobile }} | OP: {{ p.opNumber }}
    </mat-option>

  </mat-autocomplete>
</mat-form-field>

            <!-- Doctor Assignment -->
            <div class="form-section">
              <h3>Assign Doctor</h3>
              
          <mat-form-field appearance="outline" class="full-width">
  <mat-label>Select Doctor</mat-label>
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

          <!-- Visit Details -->
<div class="form-section">
  <h3>Visit Details</h3>
  
  <mat-form-field appearance="outline" class="full-width">
    <mat-label>Chief Complaint</mat-label>
    <textarea matInput formControlName="chiefComplaint" 
      placeholder="Brief description of symptoms" rows="3"></textarea>
  </mat-form-field>

  <div class="form-row">
    <mat-form-field appearance="outline" class="half-width">
      <mat-label>Priority</mat-label>
      <mat-select formControlName="priority">
        <mat-option value="Normal">Normal</mat-option>
        <mat-option value="High">High Priority</mat-option>
        <mat-option value="Emergency">Emergency</mat-option>
      </mat-select>
    </mat-form-field>

  
<mat-form-field appearance="outline" class="w-100">
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

 
    <mat-form-field appearance="outline" class="half-width">
      <mat-label>Shift</mat-label>
      <mat-select formControlName="shift" required>
        <mat-option value="Morning">Morning</mat-option>
        <mat-option value="Evening">Evening</mat-option>
      </mat-select>
    </mat-form-field>
  </div>
</div>

            <!-- Submit -->
            <div class="form-actions">
<button mat-button type="button" [routerLink]="['/reception/dashboard']">Cancel</button>              <button mat-raised-button color="primary" type="submit" 
                [disabled]="visitForm.invalid || isLoading">
                {{ isLoading ? 'Creating...' : 'Create Visit' }}
              </button>
            </div>
</mat-card>
</form>
    </div>
  `,
  styles: [`
    .create-visit-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .form-section {
      margin-bottom: 30px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .patient-info-card {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: white;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #3f51b5;
      margin-top: 15px;
    }
    .patient-details {
      flex: 1;
    }
    .detail-row {
      display: flex;
      margin-bottom: 8px;
    }
    .label {
      font-weight: 500;
      min-width: 120px;
      color: #666;
    }
    .value {
      flex: 1;
    }
    .clear-btn {
      margin-left: 10px;
    }
    .full-width { width: 100%; }
    .half-width { width: 48%; }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 30px;
    }
    @media (max-width: 768px) {
      .half-width { width: 100%; }
      .section-header { flex-direction: column; align-items: flex-start; }
    }
    .patient-placeholder {
  text-align: center;
  padding: 20px;
  color: #666;
  border: 2px dashed #ccc;
  border-radius: 8px;
  margin-top: 15px;
}

.patient-placeholder mat-icon {
  font-size: 48px;
  height: 48px;
  width: 48px;
  margin-bottom: 10px;
  color: #ccc;
}
.form-row {
  display: flex;
  gap: 20px;
  margin-top: 15px;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  .form-row .half-width {
    width: 100%;
    margin-bottom: 15px;
  }
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
selectedVisit: any = null;

ngOnInit(): void {
  this.initForm();

  const nav = history.state;
  if (nav?.patient) {
    this.selectedPatient = nav.patient;
    this.visitForm.patchValue({ patientId: nav.patient._id });
    this.patientSearchControl.setValue(nav.patient);
  }

  this.loadAvailableDoctors();
  this.loadTodaysVisits();

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

private loadTodaysVisits(): void {
  this.visitService.getTodayVisits().subscribe({
    next: (response) => {
      if (response.success && response.data) {
        this.todaysVisits = [
          ...(response.data.waiting || []),
          ...(response.data.vitals_in_progress || []),
          ...(response.data.vitals_completed || []),
          ...(response.data.consultation_in_progress || []),
          ...(response.data.consultation_completed || [])
        ];
      }
    }
  });
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

  this.patientSearchControl.setValue(patient);   // 🔥 THIS LINE FIXES DISABLE ISSUE
}

 displayPatient(patient: Patient): string {
  return patient 
    ? `${patient.fullName} | ${patient.mobile} | OP: ${patient.opNumber}`
    : '';
}

 openPatientSearch(): void {
  const dialogRef = this.dialog.open(PatientSearchComponent, {
    width: '800px',
    maxHeight: '80vh',
    id: 'patient-search-dialog' // Add an ID
  });
  dialogRef.afterClosed().subscribe((patient: Patient) => {
    if (patient) {
      this.selectedPatient = patient;
      this.visitForm.patchValue({ patientId: patient._id });
      console.log('Patient selected:', patient); // Debug log
    }
  });
}
  clearPatient(): void {
    this.selectedPatient = null;
    this.visitForm.patchValue({ patientId: '' });
  }
async createVisit(): Promise<void> {
  if (!this.selectedPatient || this.visitForm.invalid) {
    this.snackBar.open('Select patient & fill required fields', 'Close', { duration: 3000 });
    return;
  }

  this.isLoading = true;
  try {
    const response: any = await this.visitService.createVisit(this.visitForm.value).toPromise();
    this.snackBar.open(response.message, 'Close', { duration: 3000 });
    this.visitForm.reset({ priority: 'Normal', shift: 'Morning' });
    this.selectedPatient = null;
    this.loadTodaysVisits();
  } catch (error: any) {
    this.snackBar.open(error.error?.message || 'Error creating visit', 'Close', { duration: 3000 });
  } finally {
    this.isLoading = false;
  }
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
      shift: 'Morning'
    });
    this.selectedPatient = null;
    
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