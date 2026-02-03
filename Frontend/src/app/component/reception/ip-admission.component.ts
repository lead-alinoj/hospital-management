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
import { PatientService } from '../../service/patient.service';
import { VisitService } from '../../service/visit.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

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
    MatProgressSpinnerModule,
    MatRadioModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  template: `
    <div class="ip-admission-container">
      <!-- Header -->
      <div class="header-section">
        <div class="header-content">
          <mat-icon class="header-icon">
            {{ isDoctorMode ? 'local_hospital' : 'emergency' }}
          </mat-icon>
          <div>
            <h1 class="header-title">
              {{ isDoctorMode ? 'Doctor IP Recommendation' : 'Emergency IP Admission' }}
            </h1>
            <p class="header-subtitle">
              {{ isDoctorMode ? 'Recommend IP admission for patient' : 'Direct emergency admission process' }}
            </p>
          </div>
        </div>
        <div class="mode-indicator">
          <span class="mode-badge" [class.doctor-mode]="isDoctorMode" [class.emergency-mode]="!isDoctorMode">
            {{ isDoctorMode ? 'Doctor Mode' : 'Emergency Mode' }}
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-overlay">
        <div class="loading-content">
          <mat-progress-spinner 
            diameter="60" 
            mode="indeterminate" 
            color="accent">
          </mat-progress-spinner>
          <p class="loading-text">Loading patient information...</p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content" [class.blur]="isLoading">
        <!-- Doctor Mode - Patient Info Card -->
        <div *ngIf="isDoctorMode && visit" class="patient-info-card">
          <div class="patient-header">
            <div class="patient-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <div class="patient-main-info">
              <h2>{{ visit.patient?.fullName }}</h2>
              <div class="patient-tags">
                <span class="tag op-tag">
                  <mat-icon>badge</mat-icon>
                  OP: {{ visit.patient?.opNumber }}
                </span>
                <span class="tag age-tag">
                  <mat-icon>cake</mat-icon>
                  {{ visit.patient?.age }} Years
                </span>
                <span class="tag gender-tag">
                  <mat-icon>{{ visit.patient?.gender === 'Male' ? 'male' : 'female' }}</mat-icon>
                  {{ visit.patient?.gender }}
                </span>
                <span class="tag token-tag">
                  <mat-icon>confirmation_number</mat-icon>
                  Token: {{ visit.tokenNumber }}
                </span>
              </div>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <div class="patient-details-grid">
            <div class="detail-item">
              <mat-icon class="detail-icon">medical_services</mat-icon>
              <div>
                <div class="detail-label">Doctor</div>
                <div class="detail-value">{{ visit.doctor?.name }}</div>
              </div>
            </div>
            <div class="detail-item">
              <mat-icon class="detail-icon">schedule</mat-icon>
              <div>
                <div class="detail-label">Shift</div>
                <div class="detail-value">{{ visit.shift }}</div>
              </div>
            </div>
            <div class="detail-item">
              <mat-icon class="detail-icon">priority_high</mat-icon>
              <div>
                <div class="detail-label">Priority</div>
                <div class="detail-value">{{ visit.priority }}</div>
              </div>
            </div>
          </div>
          
          <div class="chief-complaint-section">
            <h3>
              <mat-icon>stethoscope</mat-icon>
              Chief Complaint
            </h3>
            <div class="complaint-content">
              {{ visit.chiefComplaint || 'No chief complaint recorded' }}
            </div>
          </div>
        </div>

        <!-- Reception Mode - Patient Selection -->
        <div *ngIf="!isDoctorMode" class="reception-flow">
          <!-- Step 1: Patient Search -->
          <div class="step-section">
            <div class="step-header">
              <div class="step-number">1</div>
              <div>
                <h3>Select Patient</h3>
                <p>Search and select a registered patient</p>
              </div>
            </div>
            
            <div class="search-container">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>
                  <mat-icon>search</mat-icon>
                  Search by name, OP number, or mobile
                </mat-label>
                <input matInput 
                  [(ngModel)]="searchQuery" 
                  (input)="searchPatients()"
                  placeholder="Type to search...">
              </mat-form-field>
              
              <div *ngIf="searchingPatients" class="searching-indicator">
                <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
                <span>Searching...</span>
              </div>
            </div>

            <!-- Patient List -->
            <div *ngIf="patients.length > 0" class="patient-list-container">
              <div class="patient-grid">
                <div *ngFor="let patient of patients" 
                     class="patient-card"
                     [class.selected]="selectedPatient?._id === patient._id"
                     (click)="selectPatient(patient)">
                  <div class="patient-card-header">
                    <div class="patient-avatar-small">
                      <mat-icon>account_circle</mat-icon>
                    </div>
                    <div class="patient-card-title">
                      <h4>{{ patient.fullName }}</h4>
                      <span class="patient-op-small">OP: {{ patient.opNumber }}</span>
                    </div>
                    <mat-icon *ngIf="selectedPatient?._id === patient._id" 
                              class="check-icon"
                              color="primary">check_circle</mat-icon>
                  </div>
                  <div class="patient-card-details">
                    <div class="detail-chip">
                      <mat-icon>phone</mat-icon>
                      {{ patient.mobile }}
                    </div>
                    <div class="detail-chip">
                      <mat-icon>cake</mat-icon>
                      {{ patient.age }}Y
                    </div>
                    <div class="detail-chip">
                      <mat-icon>{{ patient.gender === 'Male' ? 'male' : 'female' }}</mat-icon>
                      {{ patient.gender }}
                    </div>
                    <div *ngIf="patient.bloodGroup" class="detail-chip blood-chip">
                      <mat-icon>water_drop</mat-icon>
                      {{ patient.bloodGroup }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Patients Message -->
            <div *ngIf="patients.length === 0 && searchQuery" class="empty-state">
              <mat-icon>person_off</mat-icon>
              <p>No patients found matching "{{ searchQuery }}"</p>
              <button mat-stroked-button (click)="searchQuery = ''; patients = []">
                <mat-icon>clear</mat-icon>
                Clear Search
              </button>
            </div>

            <div *ngIf="patients.length === 0 && !searchQuery" class="empty-state">
              <mat-icon>search_off</mat-icon>
              <p>Start typing to search for patients</p>
            </div>
          </div>

          <!-- Selected Patient Details -->
          <div *ngIf="selectedPatient" class="selected-patient-card">
            <div class="selected-patient-header">
              <div class="selected-patient-avatar">
                <mat-icon>person_check</mat-icon>
              </div>
              <div>
                <h3>Selected Patient</h3>
                <p class="patient-selected-text">{{ selectedPatient.fullName }}</p>
              </div>
              <button mat-icon-button class="change-patient-btn" (click)="selectedPatient = null">
                <mat-icon>change_circle</mat-icon>
              </button>
            </div>
            
            <div class="selected-patient-details">
              <div class="detail-row">
                <div class="detail-column">
                  <span class="detail-label">OP Number</span>
                  <span class="detail-value highlight">{{ selectedPatient.opNumber }}</span>
                </div>
                <div class="detail-column">
                  <span class="detail-label">Mobile</span>
                  <span class="detail-value">{{ selectedPatient.mobile }}</span>
                </div>
                <div class="detail-column">
                  <span class="detail-label">Age & Gender</span>
                  <span class="detail-value">{{ selectedPatient.age }}Y / {{ selectedPatient.gender }}</span>
                </div>
              </div>
              
              <div class="detail-row" *ngIf="selectedPatient.address">
                <div class="detail-full">
                  <span class="detail-label">Address</span>
                  <span class="detail-value">{{ getFullAddress(selectedPatient.address) }}</span>
                </div>
              </div>
              
              <div class="detail-row" *ngIf="selectedPatient.emergencyContact?.name">
                <div class="detail-full">
                  <span class="detail-label">Emergency Contact</span>
                  <div class="emergency-contact">
                    <span class="contact-name">{{ selectedPatient.emergencyContact.name }}</span>
                    <span class="contact-relation">({{ selectedPatient.emergencyContact.relation }})</span>
                    <span class="contact-phone">{{ selectedPatient.emergencyContact.mobile }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Bed Selection -->
          <div *ngIf="selectedPatient" class="step-section">
            <div class="step-header">
              <div class="step-number">2</div>
              <div>
                <h3>Select Bed</h3>
                <p>Choose an available bed for admission</p>
              </div>
            </div>

            <!-- Bed Availability -->
            <div class="bed-availability-section">
              <div *ngIf="loadingBeds" class="loading-beds">
                <mat-progress-spinner diameter="40" mode="indeterminate" color="accent"></mat-progress-spinner>
                <p>Loading available beds...</p>
              </div>

              <div *ngIf="!loadingBeds && availableBeds.length > 0" class="bed-grid-container">
                <div *ngFor="let group of getGroupedBedsArray()" class="care-unit-group">
                  <div class="unit-header">
                    <div class="unit-info">
                      <mat-icon>apartment</mat-icon>
                      <div>
                        <h4>{{ group.unit.name }}</h4>
                        <p class="unit-category">{{ group.unit.category }} • {{ group.unit.capacity }} beds</p>
                      </div>
                    </div>
                    <span class="available-count">
                      {{ group.beds.length }} available
                    </span>
                  </div>
                  
                  <div class="bed-grid">
                    <div *ngFor="let bed of group.beds" 
                         class="bed-card"
                         [class.selected]="selectedBed?._id === bed._id"
                         (click)="selectBed(bed)">
                      <div class="bed-card-content">
                        <mat-icon class="bed-icon">hotel</mat-icon>
                        <div class="bed-info">
                          <span class="bed-number">{{ bed.bedNumber }}</span>
                          <span class="bed-unit">{{ bed.careUnit.unitNumber }}</span>
                        </div>
                        <mat-icon *ngIf="selectedBed?._id === bed._id" 
                                  class="bed-selected-icon"
                                  color="primary">check_circle</mat-icon>
                      </div>
                      <div *ngIf="selectedBed?._id === bed._id" class="bed-selected-label">
                        Selected
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="!loadingBeds && availableBeds.length === 0" class="empty-state">
                <mat-icon>hotel</mat-icon>
                <p>No beds available at the moment</p>
                <!-- <button mat-stroked-button (click)="loadBedAvailability()">
                  <mat-icon>refresh</mat-icon>
                  Refresh
                </button> -->
              </div>
            </div>
          </div>
        </div>

        <!-- Admission Form -->
        <div *ngIf="(isDoctorMode && visit) || (!isDoctorMode && selectedBed && selectedPatient)" 
             class="admission-form-section">
          <div class="step-header">
            <div class="step-number">{{ isDoctorMode ? '1' : '3' }}</div>
            <div>
              <h3>Admission Details</h3>
              <p>Fill in the admission information</p>
            </div>
          </div>

          <form [formGroup]="admissionForm" class="admission-form">
            <div class="form-grid">
              <!-- Doctor Mode Fields -->
              <div *ngIf="isDoctorMode" class="form-group">
                <mat-form-field appearance="outline">
                  <mat-label>Admission Type</mat-label>
                  <mat-select formControlName="admissionType">
                    <mat-option value="DOCTOR_ADVISED">
                      <mat-icon>medical_services</mat-icon>
                      Doctor Advised
                    </mat-option>
                    <mat-option value="OBSERVATION">
                      <mat-icon>visibility</mat-icon>
                      Observation
                    </mat-option>
                  </mat-select>
                  <mat-icon matSuffix>arrow_drop_down</mat-icon>
                </mat-form-field>

                <mat-form-field *ngIf="admissionForm.get('admissionType')?.value === 'OBSERVATION'" 
                              appearance="outline">
                  <mat-label>Observation End Time</mat-label>
                  <input matInput type="datetime-local" formControlName="observationEndTime">
                  <mat-icon matSuffix>schedule</mat-icon>
                </mat-form-field>
              </div>

              <!-- Reception Mode Fields -->
              <div *ngIf="!isDoctorMode" class="form-group">
                <mat-form-field appearance="outline">
                  <mat-label>Admission Type</mat-label>
                  <mat-select formControlName="admissionType" [disabled]="true">
                    <mat-option value="EMERGENCY">
                      <mat-icon>emergency</mat-icon>
                      Emergency
                    </mat-option>
                  </mat-select>
                  <mat-icon matSuffix>arrow_drop_down</mat-icon>
                </mat-form-field>
              </div>

              <!-- Admission Reason -->
              <div class="form-full-width">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>
                    <mat-icon>description</mat-icon>
                    Admission Reason *
                  </mat-label>
                  <textarea matInput 
                    formControlName="admissionReason" 
                    rows="3"
                    placeholder="Describe the clinical justification for admission...">
                  </textarea>
                  <mat-error *ngIf="admissionForm.get('admissionReason')?.hasError('required')">
                    Admission reason is required
                  </mat-error>
                </mat-form-field>
              </div>

              <!-- Clinical Notes (Doctor Only) -->
              <div *ngIf="isDoctorMode" class="form-full-width">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>
                    <mat-icon>note</mat-icon>
                    Clinical Notes
                  </mat-label>
                  <textarea matInput 
                    formControlName="clinicalNotes" 
                    rows="2"
                    placeholder="Additional clinical findings...">
                  </textarea>
                </mat-form-field>
              </div>
            </div>
          </form>

          <!-- Doctor Mode Info -->
          <div *ngIf="isDoctorMode" class="info-banner">
            <mat-icon>info</mat-icon>
            <div>
              <p><strong>Note:</strong> This recommendation will be sent to the IP Dashboard.</p>
              <p>The reception staff will allocate the bed based on availability.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons" [class.blur]="isLoading">
        <button mat-button class="cancel-btn" (click)="cancel()">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button
          mat-raised-button
          color="primary"
          class="submit-btn"
          [disabled]="isDoctorMode ? (!visit || admissionForm.invalid) : (!selectedBed || !selectedPatient || admissionForm.invalid)"
          (click)="processAdmission()">
          <mat-icon>{{ isDoctorMode ? 'recommend' : 'check_circle' }}</mat-icon>
          {{ isDoctorMode ? 'Recommend Admission' : 'Admit Patient' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .ip-admission-container {
      padding: 24px;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    /* Header Section */
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border-left: 6px solid #4fc3f7;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .header-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4fc3f7;
    }

    .header-title {
      margin: 0;
      color: #2c3e50;
      font-size: 28px;
      font-weight: 600;
    }

    .header-subtitle {
      margin: 8px 0 0 0;
      color: #7f8c8d;
      font-size: 16px;
    }

    .mode-indicator {
      display: flex;
      align-items: center;
    }

    .mode-badge {
      padding: 8px 20px;
      border-radius: 25px;
      font-weight: 500;
      font-size: 14px;
      letter-spacing: 0.5px;
    }

    .doctor-mode {
      background: linear-gradient(135deg, #ffcc80, #ffb74d);
      color: #5d4037;
    }

    .emergency-mode {
      background: linear-gradient(135deg, #ff8a80, #ff5252);
      color: white;
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-content {
      text-align: center;
    }

    .loading-text {
      margin-top: 20px;
      color: #4fc3f7;
      font-size: 18px;
      font-weight: 500;
    }

    .blur {
      filter: blur(2px);
      pointer-events: none;
    }

    /* Patient Info Card */
    .patient-info-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e8f4fd;
    }

    .patient-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;
    }

    .patient-avatar {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .patient-avatar mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #2196f3;
    }

    .patient-main-info h2 {
      margin: 0 0 12px 0;
      color: #2c3e50;
      font-size: 24px;
    }

    .patient-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }

    .tag mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .op-tag { background: #e8f5e9; color: #2e7d32; }
    .age-tag { background: #fff3e0; color: #ef6c00; }
    .gender-tag { background: #f3e5f5; color: #7b1fa2; }
    .token-tag { background: #e0f2f1; color: #00695c; }

    .patient-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 24px 0;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
    }

    .detail-icon {
      color: #4fc3f7;
    }

    .detail-label {
      font-size: 12px;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 16px;
      color: #2c3e50;
      font-weight: 500;
    }

    .chief-complaint-section {
      background: #fff8e1;
      padding: 20px;
      border-radius: 12px;
      margin-top: 20px;
    }

    .chief-complaint-section h3 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 12px 0;
      color: #f57c00;
    }

    .complaint-content {
      color: #5d4037;
      line-height: 1.6;
    }

    /* Reception Flow */
    .reception-flow {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .step-section {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border-left: 4px solid #81c784;
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .step-number {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #81c784, #4caf50);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 18px;
    }

    .step-header h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 20px;
    }

    .step-header p {
      margin: 4px 0 0 0;
      color: #7f8c8d;
      font-size: 14px;
    }

    /* Search Container */
    .search-container {
      position: relative;
      margin-bottom: 24px;
    }

    .search-field {
      width: 100%;
    }

    .searching-indicator {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      color: #7f8c8d;
    }

    /* Patient Grid */
    .patient-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }

    .patient-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .patient-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      background: white;
      border-color: #bbdefb;
    }

    .patient-card.selected {
      background: #e8f5e9;
      border-color: #81c784;
    }

    .patient-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .patient-avatar-small {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .patient-card-title {
      flex: 1;
    }

    .patient-card-title h4 {
      margin: 0;
      color: #2c3e50;
      font-size: 16px;
    }

    .patient-op-small {
      font-size: 12px;
      color: #7f8c8d;
    }

    .check-icon {
      color: #4caf50;
    }

    .patient-card-details {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .detail-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: white;
      border-radius: 16px;
      font-size: 12px;
      color: #546e7a;
      border: 1px solid #e0e0e0;
    }

    .detail-chip mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .blood-chip {
      background: #ffebee;
      color: #c62828;
      border-color: #ffcdd2;
    }

    /* Selected Patient Card */
    .selected-patient-card {
      background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
      border-radius: 16px;
      padding: 24px;
      margin-top: 16px;
    }

    .selected-patient-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .selected-patient-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .selected-patient-avatar mat-icon {
      color: #4caf50;
      font-size: 28px;
    }

    .patient-selected-text {
      font-size: 18px;
      font-weight: 500;
      color: #2e7d32;
      margin: 4px 0 0 0;
    }

    .change-patient-btn {
      margin-left: auto;
    }

    .selected-patient-details {
      background: white;
      padding: 20px;
      border-radius: 12px;
    }

    .detail-row {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
    }

    .detail-column {
      flex: 1;
    }

    .detail-full {
      width: 100%;
    }

    .detail-label {
      display: block;
      font-size: 12px;
      color: #7f8c8d;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 16px;
      color: #2c3e50;
      font-weight: 500;
    }

    .highlight {
      color: #2196f3;
      font-weight: 600;
    }

    .emergency-contact {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .contact-name {
      font-weight: 500;
      color: #2c3e50;
    }

    .contact-relation {
      color: #7f8c8d;
      font-size: 14px;
    }

    .contact-phone {
      color: #2196f3;
      font-weight: 500;
    }

    /* Bed Availability */
    .bed-availability-section {
      margin-top: 20px;
    }

    .loading-beds {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
    }

    .care-unit-group {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      border: 1px solid #e0e0e0;
    }

    .unit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .unit-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .unit-info h4 {
      margin: 0;
      color: #2c3e50;
      font-size: 18px;
    }

    .unit-category {
      margin: 4px 0 0 0;
      color: #7f8c8d;
      font-size: 14px;
    }

    .available-count {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    .bed-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }

    .bed-card {
      background: #f8fafc;
      border-radius: 10px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .bed-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .bed-card.selected {
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      border-color: #2196f3;
    }

    .bed-card-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bed-icon {
      font-size: 32px;
      color: #2196f3;
    }

    .bed-info {
      flex: 1;
    }

    .bed-number {
      display: block;
      font-size: 18px;
      font-weight: bold;
      color: #2c3e50;
    }

    .bed-unit {
      font-size: 12px;
      color: #7f8c8d;
    }

    .bed-selected-icon {
      color: #2196f3;
    }

    .bed-selected-label {
      text-align: center;
      margin-top: 8px;
      font-size: 12px;
      color: #2196f3;
      font-weight: 500;
    }

    /* Admission Form */
    .admission-form-section {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border-left: 4px solid #ffb74d;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .form-full-width {
      grid-column: 1 / -1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .info-banner {
      background: #fff3e0;
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .info-banner mat-icon {
      color: #ff9800;
      margin-top: 4px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #cfd8dc;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 32px;
      padding: 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }

    .cancel-btn {
      color: #7f8c8d;
    }

    .submit-btn {
      padding: 12px 32px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 500;
      min-width: 200px;
    }

    .submit-btn mat-icon {
      margin-right: 8px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .ip-admission-container {
        padding: 16px;
      }

      .header-section {
        flex-direction: column;
        gap: 16px;
        padding: 20px;
      }

      .header-content {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }

      .header-title {
        font-size: 24px;
      }

      .patient-grid {
        grid-template-columns: 1fr;
      }

      .detail-row {
        flex-direction: column;
        gap: 16px;
      }

      .bed-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        flex-direction: column;
        gap: 12px;
      }

      .submit-btn {
        min-width: 100%;
      }

      .emergency-contact {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }

    @media (max-width: 480px) {
      .header-title {
        font-size: 20px;
      }

      .patient-tags {
        flex-direction: column;
        align-items: flex-start;
      }

      .patient-details-grid {
        grid-template-columns: 1fr;
      }

      .step-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .bed-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Animation */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .patient-card,
    .bed-card,
    .step-section,
    .patient-info-card {
      animation: fadeIn 0.3s ease-out;
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
      shift: this.getCurrentShift(),
      isObservationCase: false
    };

    this.isLoading = true;

    this.ipService.emergencyAdmission(admissionData).subscribe({
      next: (response) => {
        console.log('✅ Admission successful:', response);
        this.showSuccess('Patient admitted successfully');
        this.router.navigate(['/ip-dashboard']);
      },
      error: (err) => {
        console.error('❌ Admission error:', err);
        const errorMessage = err.error?.message || 
                            err.error?.error || 
                            'Emergency admission failed';
        this.showError(errorMessage);
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