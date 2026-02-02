import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PatientService } from '../../service/patient.service';
import { CreatePatientRequest } from '../../models/patient.model';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatNativeDateModule
  ],
  template: `
    <div class="registration-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>New Patient Registration</mat-card-title>
          <mat-card-subtitle>Fill in patient details</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="patientForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Full Name</mat-label>
                  <mat-icon matPrefix>person</mat-icon>

                <input matInput formControlName="fullName" placeholder="Enter full name">
                <mat-error *ngIf="patientForm.get('fullName')?.hasError('required')">
                  Name is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Gender</mat-label>
                  <mat-icon matPrefix>wc</mat-icon>
                <mat-select formControlName="gender">
                  <mat-option value="Male">Male</mat-option>
                  <mat-option value="Female">Female</mat-option>
                  <mat-option value="Other">Other</mat-option>
                </mat-select>
              </mat-form-field>
<mat-form-field appearance="outline" class="half-width">
  <mat-label>Blood Group</mat-label>
    <mat-icon matPrefix>bloodtype</mat-icon>

  <mat-select formControlName="bloodGroup">
    <mat-option value="A+">A+</mat-option>
    <mat-option value="A-">A-</mat-option>
    <mat-option value="B+">B+</mat-option>
    <mat-option value="B-">B-</mat-option>
    <mat-option value="AB+">AB+</mat-option>
    <mat-option value="AB-">AB-</mat-option>
    <mat-option value="O+">O+</mat-option>
    <mat-option value="O-">O-</mat-option>
    <mat-option value="Unknown">Unknown</mat-option>
  </mat-select>
  </mat-form-field>
<mat-form-field appearance="outline" class="half-width">
  <mat-label>Date of Birth </mat-label>
<mat-icon matPrefix>calendar_today</mat-icon>

  <input matInput [matDatepicker]="picker" formControlName="dateOfBirth">
  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
  <mat-datepicker #picker></mat-datepicker>
</mat-form-field>

<mat-form-field appearance="outline" class="half-width">
  <mat-label>Age</mat-label>
    <mat-icon matPrefix>cake</mat-icon>
  <input
    matInput
    type="number"
    formControlName="age"
    [readonly]="patientForm.get('dateOfBirth')?.value">
</mat-form-field>

            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Mobile Number</mat-label>
                  <mat-icon matPrefix>phone</mat-icon>

                <input matInput formControlName="mobile" placeholder="10-digit number">
                <mat-error *ngIf="patientForm.get('mobile')?.hasError('pattern')">
                  Enter valid 10-digit mobile number
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
  <mat-label>Registration Date</mat-label>
  <input matInput [value]="today" readonly>
</mat-form-field>


              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Email (Optional)</mat-label>
                  <mat-icon matPrefix>email</mat-icon>

                <input matInput formControlName="email" type="email" placeholder="patient@email.com">
              </mat-form-field>
            </div>

            <!-- Address Section -->
            <div class="section-title">Address Details</div>
            <div class="form-row" formGroupName="address">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Street Address</mat-label>
                  <mat-icon matPrefix>home</mat-icon>

                <input matInput formControlName="street" placeholder="House no, Street, Area">
              </mat-form-field>
            </div>

            <div class="form-row" formGroupName="address">
              <mat-form-field appearance="outline" class="third-width">
                <mat-label>City</mat-label>
                <input matInput formControlName="city">
              </mat-form-field>

              <mat-form-field appearance="outline" class="third-width">
                <mat-label>State</mat-label>
                <input matInput formControlName="state">
              </mat-form-field>

              <mat-form-field appearance="outline" class="third-width">
                <mat-label>Pincode</mat-label>
                <input matInput formControlName="pincode">
              </mat-form-field>
            </div>
<div class="form-row" formGroupName="idProof">
  <mat-form-field appearance="outline" class="half-width">
    <mat-label>ID Proof Type</mat-label>

    <mat-select formControlName="type">
      <mat-option value="Aadhaar">Aadhaar</mat-option>
      <mat-option value="Voter ID">Voter ID</mat-option>
      <mat-option value="Driving License">Driving License</mat-option>
      <mat-option value="Passport">Passport</mat-option>
    </mat-select>
  </mat-form-field>

  <mat-form-field appearance="outline" class="half-width">
    <mat-label>ID Proof Number</mat-label>
          <mat-icon matPrefix>badge</mat-icon>

    <input matInput formControlName="number">
  </mat-form-field>
</div>

            <!-- Emergency Contact -->
            <div class="section-title">Emergency Contact</div>
            <div class="form-row" formGroupName="emergencyContact">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Contact Name</mat-label>
                  <mat-icon matPrefix>contact_phone</mat-icon>

                <input matInput formControlName="name">
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Relation</mat-label>
                <input matInput formControlName="relation" placeholder="Spouse, Parent, etc.">
              </mat-form-field>
            </div>

            <div class="form-row" formGroupName="emergencyContact">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Mobile Number</mat-label>
                <input matInput formControlName="mobile">
              </mat-form-field>
            </div>

            <!-- Medical History -->
            <div class="section-title">Medical History</div>
            <div class="form-row" formGroupName="medicalHistory">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Allergies (comma separated)</mat-label>
                <textarea matInput formControlName="allergies" placeholder="Penicillin, NSAIDs, etc." rows="2"></textarea>
              </mat-form-field>
            </div>

            <div class="form-row" formGroupName="medicalHistory">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Chronic Diseases</mat-label>
                <textarea matInput formControlName="chronicDiseases" placeholder="Diabetes, Hypertension, etc." rows="2"></textarea>
              </mat-form-field>
            </div>

            <!-- Submit Buttons -->
            <div class="form-actions">
              <button mat-button type="button" (click)="resetForm()">Clear</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="patientForm.invalid || isLoading">
                {{ isLoading ? 'Registering...' : 'Register Patient' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
styles: [`
  :host {
    display: block;
  background: linear-gradient(135deg, #e3f2fd, #f1f8ff);
    min-height: 100vh;
  }

  .registration-container {
    padding: 20px;
    max-width: 1200px;
    margin: auto;
  }

mat-card {
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(25, 118, 210, 0.15);
}

mat-card-title {
  font-size: 22px;
  font-weight: 700;
  color: #1565c0;
}

mat-card-subtitle {
  color: #64b5f6;
}


  .form-row {
    display: flex;
    gap: 20px;
    margin-bottom: 18px;
  }

  mat-form-field {
    width: 100%;
  }

  .full-width { width: 100%; }
  .half-width { flex: 1; }
  .third-width { flex: 1; }

  .section-title {
   font-size: 15px;
  font-weight: 700;
  margin: 28px 0 14px;
  color: #1e88e5;
  border-left: 5px solid #42a5f5;
  padding-left: 12px;
}

mat-form-field {
  background: #f8fbff;
  border-radius: 12px;
}

mat-form-field.mat-focused .mat-mdc-form-field-outline {
  color: #1e88e5;
}

mat-icon {
  color: #64b5f6;
}
  .form-actions button[mat-raised-button] {
  background: linear-gradient(135deg, #42a5f5, #1e88e5);
  color: white;
  border-radius: 25px;
  padding: 10px 28px;
}

.form-actions button[mat-button] {
  color: #1e88e5;
}
@media (max-width: 900px) {
  .form-row {
    flex-direction: column;
  }
}
  button[mat-raised-button] {
    min-width: 160px;
  }

  /* Mobile */
  @media (max-width: 900px) {
    .form-row {
      flex-direction: column;
    }
  }
`]

})
export class PatientRegistrationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private snackBar = inject(MatSnackBar);

  patientForm!: FormGroup;
  isLoading = false;
today = new Date();

 ngOnInit(): void {
  this.initForm();

  this.patientForm.get('dateOfBirth')?.valueChanges.subscribe(dob => {
    if (dob) {
      const age = this.calculateAge(dob);
      this.patientForm.patchValue({ age });
      this.patientForm.get('age')?.disable();
    } else {
      this.patientForm.get('age')?.enable();
    }
  });
}

calculateAge(dob: Date): number {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

  private initForm(): void {
    this.patientForm = this.fb.group({
      fullName: ['', Validators.required],
      gender: ['Male', Validators.required],
      registrationDate: [new Date(), Validators.required],

   dateOfBirth: [null],
age: [null, [Validators.min(0), Validators.max(120)]],

      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: [''],
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        pincode: ['']
      }),
        idProof: this.fb.group({        // ✅ ADD THIS
      type: [''],
      number: ['']
    }),
      emergencyContact: this.fb.group({
        name: [''],
        relation: [''],
        mobile: ['']
      }),
      medicalHistory: this.fb.group({
        allergies: [''],
        chronicDiseases: [''],
        previousSurgeries: [''],
        currentMedications: ['']
      }),
      bloodGroup: [''],
      patientType: ['OP']
    });
  }

 async onSubmit(): Promise<void> {
  if (this.patientForm.invalid) return;

  const formValue = this.patientForm.value;

  // ✅ DOB OR AGE mandatory check
  if (!formValue.dateOfBirth && !formValue.age) {
    this.snackBar.open(
      'Please enter either Date of Birth or Age',
      'Close',
      { duration: 4000 }
    );
    return; // ⛔ STOP submission
  }

  this.isLoading = true;

  try {
    if (!formValue.bloodGroup) {
      formValue.bloodGroup = 'Unknown';
    }

    const patientData: CreatePatientRequest = {
      ...formValue,
      medicalHistory: {
        ...formValue.medicalHistory,
        allergies: formValue.medicalHistory.allergies
          .split(',')
          .map((a: string) => a.trim())
          .filter(Boolean),
        chronicDiseases: formValue.medicalHistory.chronicDiseases
          .split(',')
          .map((d: string) => d.trim())
          .filter(Boolean),
        previousSurgeries: formValue.medicalHistory.previousSurgeries
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
        currentMedications: formValue.medicalHistory.currentMedications
          .split(',')
          .map((m: string) => m.trim())
          .filter(Boolean)
      }
    };
// ✅ REMOVE empty idProof (VERY IMPORTANT)
if (
  !patientData.idProof?.type &&
  !patientData.idProof?.number
) {
  delete patientData.idProof;
}

    const response = await this.patientService.createPatient(patientData).toPromise();

    this.snackBar.open(
      `Patient registered successfully! OP Number: ${response.data.opNumber}`,
      'Close',
      { duration: 5000 }
    );

    this.resetForm();

  } catch (error: any) {
    console.error('Error registering patient:', error);
    this.snackBar.open(
      error.error?.message || 'Error registering patient',
      'Close',
      { duration: 5000 }
    );
  } finally {
    this.isLoading = false;
  }
}

  resetForm(): void {
    this.patientForm.reset({
      gender: 'Male',
      patientType: 'OP',
      address: {},
      emergencyContact: {},
      medicalHistory: {
        allergies: '',
        chronicDiseases: '',
        previousSurgeries: '',
        currentMedications: ''
      }
    });
  }
}