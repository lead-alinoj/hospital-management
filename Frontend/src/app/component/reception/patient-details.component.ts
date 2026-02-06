import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Patient } from '../../models/patient.model';
import { VisitService } from '../../service/visit.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService } from '../../service/patient.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatExpansionModule } from "@angular/material/expansion";

interface DialogData {
  patient: Patient;
}

@Component({
  selector: 'app-patient-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTabsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule
],
  template: `
    <div class="patient-details-dialog">

  <!-- Header -->
  <div class="dialog-header">
    <h2 mat-dialog-title>{{ editMode ? 'Edit Patient' : 'Patient Details' }}</h2>
    <button mat-icon-button (click)="onClose()" class="close-button">
      <mat-icon>close</mat-icon>
    </button>
  </div>

  <mat-dialog-content>

    <!-- ================= VIEW MODE ================= -->
    <ng-container *ngIf="!editMode">

      <!-- ================= PATIENT BASIC DETAILS ================= -->
      <mat-card class="patient-card">
        <mat-card-header>
          <div class="patient-header">
            <mat-icon class="patient-avatar">person</mat-icon>

            <div class="patient-title">
              <mat-card-title>{{ patient.fullName }}</mat-card-title>
              <mat-card-subtitle>OP Number: {{ patient.opNumber }}</mat-card-subtitle>
            </div>

            <mat-chip-listbox>
              <mat-chip [color]="patient.patientType === 'IP' ? 'warn' : 'primary'" selected>
                {{ patient.patientType }}
              </mat-chip>
              <mat-chip *ngIf="!patient.isActive" color="warn" selected>
                Inactive
              </mat-chip>
            </mat-chip-listbox>
          </div>
        </mat-card-header>

        <mat-card-content>

          <!-- Basic Info -->
          <div class="info-section">
            <h3>Basic Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <mat-icon class="info-icon">wc</mat-icon>
                <div class="info-content">
                  <span class="label">Gender / Age</span>
                  <span class="value">{{ patient.gender }}, {{ patient.age }} yrs</span>
                </div>
              </div>

              <div class="info-item">
                <mat-icon class="info-icon">cake</mat-icon>
                <div class="info-content">
                  <span class="label">Date of Birth</span>
                  <span class="value">{{ patient.dateOfBirth | date:'longDate' }}</span>
                </div>
              </div>

              <div class="info-item">
                <mat-icon class="info-icon">phone</mat-icon>
                <div class="info-content">
                  <span class="label">Mobile</span>
                  <span class="value">{{ patient.mobile }}</span>
                </div>
              </div>

              <div class="info-item">
                <mat-icon class="info-icon">email</mat-icon>
                <div class="info-content">
                  <span class="label">Email</span>
                  <span class="value">{{ patient.email || 'Not provided' }}</span>
                </div>
              </div>

              <div class="info-item">
                <mat-icon class="info-icon">bloodtype</mat-icon>
                <div class="info-content">
                  <span class="label">Blood Group</span>
                  <span class="value">{{ patient.bloodGroup || 'Not recorded' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Address -->
          <div class="info-section">
            <h3>Address</h3>
            <p>{{ patient.address.street }}</p>
            <p>{{ patient.address.city }}, {{ patient.address.state }} - {{ patient.address.pincode }}</p>
            <p>{{ patient.address.country || 'India' }}</p>
          </div>

          <!-- Medical History -->
          <div class="info-section" *ngIf="hasMedicalHistory()">
            <h3>Medical History</h3>

            <div *ngIf="patient.medicalHistory.allergies.length">
              <strong>Allergies:</strong>
              <mat-chip-listbox>
                <mat-chip *ngFor="let a of patient.medicalHistory.allergies" color="warn" selected>
                  {{ a }}
                </mat-chip>
              </mat-chip-listbox>
            </div>

            <div *ngIf="patient.medicalHistory.chronicDiseases.length">
              <strong>Chronic Diseases:</strong>
              <mat-chip-listbox>
                <mat-chip *ngFor="let d of patient.medicalHistory.chronicDiseases" color="primary" selected>
                  {{ d }}
                </mat-chip>
              </mat-chip-listbox>
            </div>
          </div>

        </mat-card-content>
      </mat-card>

      <!-- ================= HISTORY BUTTON ================= -->
      <div style="margin:16px 0;">
        <button mat-stroked-button color="primary"
                (click)="showHistory = !showHistory">
          <mat-icon>history</mat-icon>
          {{ showHistory ? 'Hide History' : 'View History' }}
        </button>
      </div>

      <!-- ================= PATIENT HISTORY (CORRECT PLACE) ================= -->
      <div class="info-section patient-history"
           *ngIf="showHistory && visitHistory.length">

        <h3>Patient Visit History</h3>

        <mat-accordion>
          <mat-expansion-panel *ngFor="let visit of visitHistory">

            <mat-expansion-panel-header>
              <mat-panel-title>
                {{ visit.visitDate | date:'mediumDate' }} | Token {{ visit.tokenNumber }}
              </mat-panel-title>
              <mat-panel-description>
                <span [ngClass]="getStatusClass(visit.visitStatus)">
                  {{ visit.visitStatus }}
                </span>
              </mat-panel-description>
            </mat-expansion-panel-header>

            <p><strong>Doctor:</strong> {{ visit.doctor?.name }}</p>
            <p><strong>Visit Type:</strong> {{ visit.visitType }}</p>
            <p><strong>Chief Complaint:</strong> {{ visit.chiefComplaint || 'N/A' }}</p>
            <p><strong>Priority:</strong> {{ visit.priority }}</p>

            <div *ngIf="visit.vitals">
              <p><strong>BP:</strong> {{ visit.vitals.bloodPressure }}</p>
              <p><strong>Pulse:</strong> {{ visit.vitals.pulse }}</p>
            </div>

            <mat-action-row>
              <button mat-button color="primary" (click)="editVisit(visit)">
                <mat-icon>edit</mat-icon> Edit Visit
              </button>
              <button mat-button color="warn" (click)="deleteVisit(visit)">
                <mat-icon>delete</mat-icon> Delete Visit
              </button>
            </mat-action-row>

          </mat-expansion-panel>
        </mat-accordion>
      </div>

    </ng-container>

    <!-- ================= EDIT MODE ================= -->
    <ng-container *ngIf="editMode">
      <!-- YOUR EDIT FORM REMAINS UNCHANGED -->
    </ng-container>

  </mat-dialog-content>

  <!-- ================= ACTION BUTTONS ONLY ================= -->
  <mat-dialog-actions align="end">
    <button mat-button (click)="onClose()">Close</button>

    <button mat-raised-button color="primary" (click)="createVisit()" *ngIf="!editMode">
      <mat-icon>add_circle</mat-icon> Create Visit
    </button>

    <button mat-raised-button color="accent" (click)="editPatient()" *ngIf="!editMode">
      <mat-icon>edit</mat-icon> Edit Patient
    </button>

    <button mat-raised-button color="warn" (click)="deletePatient()" *ngIf="!editMode">
      <mat-icon>delete</mat-icon> Delete Patient
    </button>
  </mat-dialog-actions>

</div>

  `,
  styles: [`
    .patient-details-dialog {
      max-width: 800px;
    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 0 24px;
    }
    
    .close-button {
      margin-right: -8px;
    }
    
    .patient-card {
      margin-top: 16px;
    }
    
    .patient-header {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
    }
    
    .patient-avatar {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #3f51b5;
    }
    
    .patient-title {
      flex: 1;
    }
    
    .info-section {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
    }
    
    .info-section:last-child {
      border-bottom: none;
    }
    
    .info-section h3 {
      margin: 0 0 16px 0;
      color: #3f51b5;
      font-size: 18px;
    }
    
    .info-section h4 {
      margin: 16px 0 8px 0;
      color: #666;
      font-size: 14px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
    }
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .info-icon {
      color: #666;
      flex-shrink: 0;
    }
    
    .info-content {
      display: flex;
      flex-direction: column;
    }
    
    .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 2px;
    }
    
    .value {
      font-size: 14px;
      color: #333;
    }
    
    .value a {
      color: inherit;
      text-decoration: none;
    }
    
    .value a:hover {
      color: #3f51b5;
    }
    
    .address-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    
    .address-content p {
      margin: 4px 0;
      color: #333;
    }
    
    .medical-history {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .history-section {
      margin-bottom: 8px;
    }
    
    .visits-list {
      max-height: 200px;
      overflow-y: auto;
    }
    
    .visit-item {
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 8px;
      transition: background-color 0.2s;
    }
    
    .visit-item:hover {
      background: #e8eaf6;
    }
    
    .visit-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .visit-date {
      font-weight: 500;
      color: #333;
    }
    
    .visit-token {
      color: #666;
      font-size: 12px;
    }
    
    .visit-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .doctor {
      font-size: 14px;
      color: #666;
    }
    
    .status {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
      background: #e0e0e0;
      color: #333;
    }
    
    .status-registered { background: #bbdefb; color: #1565c0; }
    .status-waiting { background: #fff3e0; color: #ef6c00; }
    .status-vitals_completed { background: #e8f5e9; color: #2e7d32; }
    .status-consultation_completed { background: #f3e5f5; color: #7b1fa2; }
    
    /* Edit Form Styles */
    .edit-form {
      padding: 16px;
    }
    
    .form-section {
      margin-bottom: 32px;
    }
    
    .form-section h3 {
      color: #3f51b5;
      margin: 0 0 20px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .full-width { width: 100%; }
    .half-width { flex: 1; }
    .third-width { flex: 1; }
    
    @media (max-width: 768px) {
      .patient-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .info-grid {
        grid-template-columns: 1fr;
      }
      
      .visit-header {
        flex-direction: column;
        gap: 4px;
      }
      
      .visit-details {
        flex-direction: column;
        gap: 4px;
        align-items: flex-start;
      }
      
      .form-row {
        flex-direction: column;
      }
      
      .half-width, .third-width {
        width: 100%;
      }
    }
  `]
})
export class PatientDetailsComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<PatientDetailsComponent>);
  private visitService = inject(VisitService);
  private data = inject<DialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private snackBar = inject(MatSnackBar);

  patient: Patient = this.data.patient;
  visitHistory: any[] = [];
  editMode = false;
  patientForm!: FormGroup;
  isLoading = false;
showHistory = false;

  ngOnInit(): void {
    this.loadVisitHistory();
    this.initForm();
  }

 private loadVisitHistory(): void {
  this.visitService.getPatientVisits(this.patient._id).subscribe({
    next: (res: any) => {
      this.visitHistory = res.data || [];
    },
    error: (error) => {
      console.error('Error loading visit history:', error);
    }
  });
}


  private initForm(): void {
    // Format arrays to comma-separated strings for the form
    const formatArray = (arr: string[] | undefined) => 
      arr && arr.length > 0 ? arr.join(', ') : '';

    this.patientForm = this.fb.group({
      fullName: [this.patient.fullName, Validators.required],
      gender: [this.patient.gender, Validators.required],
      dateOfBirth: [new Date(this.patient.dateOfBirth), Validators.required],
      mobile: [this.patient.mobile, [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: [this.patient.email || '', Validators.email],
      bloodGroup: [this.patient.bloodGroup || ''],
      patientType: [this.patient.patientType || 'OP'],
      address: this.fb.group({
        street: [this.patient.address.street || ''],
        city: [this.patient.address?.city || ''],
        state: [this.patient.address?.state || ''],
        pincode: [this.patient.address?.pincode || ''],
        country: [this.patient.address?.country || 'India']
      }),
      emergencyContact: this.fb.group({
        name: [this.patient.emergencyContact?.name || ''],
        relation: [this.patient.emergencyContact?.relation || ''],
        mobile: [this.patient.emergencyContact?.mobile || '']
      }),
      medicalHistory: this.fb.group({
        allergies: [formatArray(this.patient.medicalHistory?.allergies)],
        chronicDiseases: [formatArray(this.patient.medicalHistory?.chronicDiseases)],
        previousSurgeries: [formatArray(this.patient.medicalHistory?.previousSurgeries)],
        currentMedications: [formatArray(this.patient.medicalHistory?.currentMedications)]
      })
    });
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Registered': 'status-registered',
      'Waiting': 'status-waiting',
      'Vitals_Completed': 'status-vitals_completed',
      'Consultation_Completed': 'status-consultation_completed'
    };
    return statusMap[status] || '';
  }

hasMedicalHistory(): boolean {
  const history = this.patient.medicalHistory;
  return !!(
    history.allergies.length ||
    history.chronicDiseases.length ||
    history.previousSurgeries.length ||
    history.currentMedications.length
  );
}


  onClose(): void {
    this.dialogRef.close();
  }

  createVisit(): void {
    this.dialogRef.close({ action: 'create-visit', patient: this.patient });
  }

  editVisit(visit: any): void {
    this.dialogRef.close({ action: 'edit-visit', visit });
  }

  deleteVisit(visit: any): void {
    if (confirm('Are you sure you want to delete this visit?')) {
      this.dialogRef.close({ action: 'delete-visit', visit });
    }
  }

  editPatient(): void {
    this.editMode = true;
  }

  async savePatient(): Promise<void> {
    if (this.patientForm.invalid) {
      this.markFormGroupTouched(this.patientForm);
      return;
    }

    this.isLoading = true;

    try {
      const formValue = this.patientForm.value;
      
      // Parse comma-separated strings back to arrays
      const parseCommaSeparated = (str: string): string[] => 
        str.split(',').map(item => item.trim()).filter(item => item !== '');

      const updatedPatient: any = {
        ...formValue,
        medicalHistory: {
          allergies: parseCommaSeparated(formValue.medicalHistory.allergies),
          chronicDiseases: parseCommaSeparated(formValue.medicalHistory.chronicDiseases),
          previousSurgeries: parseCommaSeparated(formValue.medicalHistory.previousSurgeries),
          currentMedications: parseCommaSeparated(formValue.medicalHistory.currentMedications)
        }
      };

      const response = await this.patientService.updatePatient(this.patient._id, updatedPatient).toPromise();
      
      // Update local patient data with the response
      this.patient = response.data;
      
      // Exit edit mode
      this.editMode = false;
      
      // Show success message
      this.snackBar.open('Patient updated successfully!', 'Close', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      
    } catch (error: any) {
      console.error('Error updating patient:', error);
      
      // Show error message
      let errorMessage = 'Error updating patient. Please try again.';
      if (error.error?.message) {
        errorMessage = error.error.message;
      }
      
      this.snackBar.open(errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading = false;
    }
  }

  cancelEdit(): void {
    this.editMode = false;
    this.initForm(); // Reset form to original patient data
  }

  deletePatient(): void {
    if (confirm('Are you sure you want to delete this patient? All associated visits will also be deleted.')) {
      this.dialogRef.close({ action: 'delete-patient', patient: this.patient });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}