// components/reception/dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { VisitService } from '../../service/visit.service';
import { TodayVisitsResponse } from '../../models/visit.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-reception-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatBadgeModule,
    MatTabsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule
],
  template: `
    <div class="dashboard-container">
      <!-- Quick Actions -->
      <div class="quick-actions">
        <mat-card class="action-card">
          <mat-card-header>
            <mat-card-title>Quick Actions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-buttons">
              <button mat-raised-button color="primary" routerLink="/reception/patient/register">
                <mat-icon>person_add</mat-icon>
                New Patient
              </button>
              <button mat-raised-button color="accent" routerLink="/reception/visit/create">
                <mat-icon>add_circle</mat-icon>
                New Visit
              </button>
              <button mat-raised-button color="primary" routerLink="/reception/patient/search">
                <mat-icon>search</mat-icon>
                Search Patient
              </button>
               <button mat-raised-button color="warn" (click)="createEmergencyAdmission()">
    <mat-icon>emergency</mat-icon>
     IP Admission
  </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Today's Visits Overview -->
      <div class="visits-overview">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Today's Visits Summary</mat-card-title>
            <span class="total-count">{{ totalVisits }} visits today</span>
          </mat-card-header>

          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-card" [ngClass]="getStatusClass('registered')">
                <div class="stat-number">{{ visitSummary.registered || 0 }}</div>
                <div class="stat-label">Registered</div>
              </div>
              <div class="stat-card" [ngClass]="getStatusClass('waiting')">
                <div class="stat-number">{{ visitSummary.waiting || 0 }}</div>
                <div class="stat-label">Waiting</div>
              </div>
              <div class="stat-card" [ngClass]="getStatusClass('vitals_in_progress')">
                <div class="stat-number">{{ visitSummary.vitals_in_progress || 0 }}</div>
                <div class="stat-label">Vitals In Progress</div>
              </div>
              <div class="stat-card" [ngClass]="getStatusClass('vitals_completed')">
                <div class="stat-number">{{ visitSummary.vitals_completed || 0 }}</div>
                <div class="stat-label">Vitals Done</div>
              </div>
              <div class="stat-card" [ngClass]="getStatusClass('consultation_completed')">
                <div class="stat-number">{{ visitSummary.consultation_completed || 0 }}</div>
                <div class="stat-label">Consultation Done</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Recent Visits -->
      <div class="recent-visits">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Recent Visits</mat-card-title>
            <button mat-button color="primary" (click)="refreshVisits()">
              <mat-icon>refresh</mat-icon>
              Refresh
            </button>
          </mat-card-header>

          <mat-card-content>
<mat-tab-group animationDuration="0ms">
             <mat-tab label="Waiting for Nurse">
  <div class="visits-list">
    <div *ngFor="let visit of visits.waitingForNurse" class="visit-item">
      <div class="visit-info">
        <span class="token">{{ visit.tokenNumber }}</span>
        <span class="patient-name">{{ visit.patient?.fullName || 'N/A' }}</span>
        <span class="doctor">{{ visit.doctor?.name || 'N/A' }}</span>
      </div>
      <div class="visit-actions">
        <button mat-button color="primary" (click)="viewVisit(visit._id)">
          View
        </button>
      </div>
    </div>
  </div>
</mat-tab>


              <mat-tab label="Vitals Completed">
                <div class="visits-list">
                  <div *ngFor="let visit of visits.vitals_completed" class="visit-item">
                    <div class="visit-info">
                      <span class="token">{{ visit.tokenNumber }}</span>
                      <span class="patient-name">{{ visit.patient?.fullName }}</span>
                      <span class="doctor">{{ visit.doctor?.name }}</span>
                    </div>
                    <div class="visit-actions">
                      <button mat-button color="primary" (click)="viewVisit(visit._id)">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card-content>
        </mat-card>
      </div>
      <div *ngIf="selectedVisit" class="visit-details-card">
  <mat-card>
    <mat-card-header>
      <mat-card-title>Visit Details</mat-card-title>
      <mat-card-subtitle>Token: {{ selectedVisit.tokenNumber }}</mat-card-subtitle>
    </mat-card-header>
    <mat-card-content>
      <p><strong>Patient:</strong> {{ selectedVisit.patient?.fullName }}</p>
      <p><strong>Doctor:</strong> {{ selectedVisit.doctor?.name }}</p>
      <p><strong>Visit Type:</strong> {{ selectedVisit.visitType }}</p>
      <p><strong>Priority:</strong> {{ selectedVisit.priority }}</p>
      <p><strong>Chief Complaint:</strong> {{ selectedVisit.chiefComplaint }}</p>
      <p><strong>Status:</strong> {{ selectedVisit.visitStatus }}</p>

      <!-- Update Form -->
      <form [formGroup]="visitForm" class="update-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Doctor</mat-label>
          <mat-select formControlName="doctorId">
            <mat-option *ngFor="let doctor of availableDoctors" [value]="doctor._id">
              {{ doctor.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Priority</mat-label>
          <mat-select formControlName="priority">
            <mat-option value="Normal">Normal</mat-option>
            <mat-option value="High">High</mat-option>
            <mat-option value="Emergency">Emergency</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Visit Type</mat-label>
          <mat-select formControlName="visitType">
            <mat-option value="OP">Out Patient (OP)</mat-option>
            <mat-option value="IP">In Patient (IP)</mat-option>
            <mat-option value="FollowUp">Follow-up</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Chief Complaint</mat-label>
          <textarea matInput formControlName="chiefComplaint" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-card-content>
    <mat-card-actions>
      <button mat-button color="primary" (click)="updateVisit()">Update</button>
      <button mat-button color="warn" (click)="deleteVisit(selectedVisit)">Delete</button>
      <button mat-button (click)="selectedVisit=null">Close</button>
    </mat-card-actions>
  </mat-card>
</div>
    </div>
  `,
styles: [`
/* ================= VARIABLES ================= */
$primary: #2196f3;
$primary-light: #64b5f6;
$primary-dark: #1976d2;
$accent: #ff4081;
$success: #43e97b;
$warning: #ff9800;
$danger: #ff5252;
$info: #4facfe;
$light: #f8fbff;
$white: #ffffff;
$dark: #1a237e;
$gray: #5a6c7d;
$gray-light: #eef5ff;
$shadow-light: 0 2px 8px rgba(33, 150, 243, 0.08);
$shadow-medium: 0 4px 20px rgba(33, 150, 243, 0.12);
$shadow-heavy: 0 8px 30px rgba(33, 150, 243, 0.15);
$border-radius: 16px;
$border-radius-sm: 12px;
$border-radius-xs: 8px;

/* ================= BASE STYLES ================= */
.dashboard-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fbff 0%, #eef5ff 100%);
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

  @media (max-width: 1200px) {
    padding: 20px;
    gap: 20px;
  }

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    gap: 12px;
  }
}

/* ================= COMMON CARD STYLES ================= */
.mat-card {
  border-radius: $border-radius;
  border: 1px solid rgba(33, 150, 243, 0.08);
  box-shadow: $shadow-medium;
  background: linear-gradient(135deg, $white 0%, $light 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-heavy;
  }

  .mat-card-header {
    display: flex;
    align-items: center;
    padding: 24px 24px 12px;
    border-bottom: 1px solid rgba(33, 150, 243, 0.1);
    background: linear-gradient(135deg, $light 0%, $gray-light 100%);

    @media (max-width: 768px) {
      padding: 20px 20px 10px;
    }

    @media (max-width: 480px) {
      padding: 16px 16px 8px;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .mat-card-title {
      font-size: 20px;
      font-weight: 600;
      color: $dark;
      margin: 0;
      flex: 1;

      @media (max-width: 768px) {
        font-size: 18px;
      }

      @media (max-width: 480px) {
        font-size: 16px;
        width: 100%;
      }
    }
  }

  .mat-card-content {
    padding: 24px;

    @media (max-width: 768px) {
      padding: 20px;
    }

    @media (max-width: 480px) {
      padding: 16px;
    }
  }
}

/* ================= QUICK ACTIONS ================= */
.quick-actions {
  .action-card {
    .mat-card-content {
      padding: 24px;
    }
  }

  .action-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 14px;

    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }

    button {
      height: 72px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 12px;
      gap: 6px;

      @media (max-width: 768px) {
        height: 90px;
        font-size: 15px;
        padding: 16px;
      }

      @media (max-width: 480px) {
        height: 80px;
        font-size: 14px;
        padding: 12px;
      }

      &:hover {
        transform: translateY(-4px);
        box-shadow: $shadow-heavy;

        &::after {
          opacity: 0.15;
        }
      }

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      mat-icon {
        font-size: 22px;
        height: 22px;
        width: 22px;

        @media (max-width: 768px) {
          font-size: 13px;
          height: 64px;
          width: 28px;
        }

        @media (max-width: 480px) {
          font-size: 13px;
          height: 56px;
          width: 24px;
        }
      }

      &.mat-primary {
        background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
        color: $white;

        &:hover {
          background: linear-gradient(135deg, $primary-dark 0%, #1565c0 100%);
        }
      }

      &.mat-accent {
        background: linear-gradient(135deg, $accent 0%, #f50057 100%);
        color: $white;

        &:hover {
          background: linear-gradient(135deg, #f50057 0%, #c51162 100%);
        }
      }

      &.mat-warn {
        background: linear-gradient(135deg, #ff6b6b 0%, $danger 100%);
        color: $white;

        &:hover {
          background: linear-gradient(135deg, $danger 0%, #d50000 100%);
        }
      }
    }
  }
}

/* ================= VISITS OVERVIEW ================= */
.visits-overview {
  .total-count {
    margin-left: auto;
    font-size: 14px;
    font-weight: 500;
    color: $primary;
    background: rgba(33, 150, 243, 0.1);
    padding: 8px 16px;
    border-radius: 20px;

    @media (max-width: 480px) {
      margin-left: 0;
      align-self: flex-start;
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
    margin-top: 16px;

    @media (max-width: 1024px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }

    .stat-card {
      padding: 14px;
      border-radius: 12px;
      text-align: center;
      color: $white;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      min-height: 80px;
      display: flex;
      flex-direction: column;
      justify-content: center;

      @media (max-width: 768px) {
        padding: 20px;
        min-height: 110px;
      }

      @media (max-width: 480px) {
        padding: 16px;
        min-height: 100px;
      }

      &:hover {
        transform: translateY(-3px) scale(1.02);
        box-shadow: $shadow-heavy;

        &::after {
          opacity: 0.2;
        }
      }

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .stat-number {
        font-size: 26px;
        font-weight: 700;
        margin-bottom: 4px;
        position: relative;
        z-index: 1;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

        @media (max-width: 768px) {
          font-size: 32px;
        }

        @media (max-width: 480px) {
          font-size: 28px;
        }
      }

      .stat-label {
        font-size: 11px;
        opacity: 0.95;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        position: relative;
        z-index: 1;

        @media (max-width: 480px) {
          font-size: 12px;
        }
      }

      &.status-registered { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }
      
      &.status-waiting { 
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);
      }
      
      &.status-vitals_in_progress { 
        background: linear-gradient(135deg, $info 0%, #00f2fe 100%);
        box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
      }
      
      &.status-vitals_completed { 
        background: linear-gradient(135deg, $success 0%, #38f9d7 100%);
        box-shadow: 0 4px 15px rgba(67, 233, 123, 0.3);
      }
      
      &.status-consultation_completed { 
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        box-shadow: 0 4px 15px rgba(250, 112, 154, 0.3);
      }
    }
  }
}

/* ================= RECENT VISITS ================= */
.recent-visits {
  .mat-card-header {
    button {
      margin-left: auto;
      font-weight: 500;
      border-radius: $border-radius-xs;
      padding: 8px 16px;
      transition: all 0.2s ease;

      @media (max-width: 480px) {
        margin-left: 0;
        width: 100%;
      }

      &:hover {
        background: rgba(33, 150, 243, 0.1);
      }

      mat-icon {
        margin-right: 8px;
        font-size: 20px;
        height: 20px;
        width: 20px;
      }
    }
  }

  ::ng-deep {
    .mat-tab-group {
      .mat-tab-header {
        border-bottom: 1px solid rgba(33, 150, 243, 0.1);
        background: linear-gradient(135deg, $light 0%, $gray-light 100%);
        border-radius: $border-radius-sm $border-radius-sm 0 0;
      }

      .mat-tab-label {
        font-weight: 500;
        color: $gray;
        opacity: 1;
        font-size: 14px;
        padding: 0 24px;
        min-width: 120px;

        @media (max-width: 768px) {
          padding: 0 16px;
          min-width: 100px;
          font-size: 13px;
        }

        @media (max-width: 480px) {
          padding: 0 12px;
          min-width: auto;
          flex: 1;
        }

        &.mat-tab-label-active {
          color: $primary;
          font-weight: 600;
        }
      }

      .mat-ink-bar {
        background: linear-gradient(90deg, $primary 0%, $primary-dark 100%);
        height: 3px;
        border-radius: 3px 3px 0 0;
      }

      .mat-tab-body-content {
        padding: 24px 0;
      }
    }
  }

  .visits-list {
    max-height: 400px;
    overflow-y: auto;
    padding: 0 16px;

    /* Custom scrollbar */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(33, 150, 243, 0.05);
      border-radius: 3px;
      margin: 4px 0;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(33, 150, 243, 0.2);
      border-radius: 3px;

      &:hover {
        background: rgba(33, 150, 243, 0.3);
      }
    }

    @media (max-width: 768px) {
      max-height: 350px;
    }

    @media (max-width: 480px) {
      max-height: 300px;
      padding: 0 8px;
    }
  }

  .visit-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    margin-bottom: 12px;
    background: $white;
    border-radius: $border-radius-sm;
    border: 1px solid rgba(33, 150, 243, 0.1);
    transition: all 0.2s ease;
    gap: 16px;

    @media (max-width: 768px) {
      padding: 14px 16px;
      gap: 12px;
    }

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    &:hover {
      transform: translateX(2px);
      box-shadow: $shadow-light;
      border-color: rgba(33, 150, 243, 0.2);
      background: linear-gradient(135deg, $light 0%, $gray-light 100%);
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .visit-info {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      gap: 16px;
    }

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .token {
      background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
      color: $white;
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 13px;
      min-width: 80px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
      white-space: nowrap;

      @media (max-width: 480px) {
        min-width: 70px;
        padding: 5px 12px;
        font-size: 12px;
      }
    }

    .patient-name {
      font-weight: 500;
      color: $dark;
      font-size: 16px;
      min-width: 200px;
      word-break: break-word;

      @media (max-width: 768px) {
        min-width: 150px;
        font-size: 15px;
      }

      @media (max-width: 600px) {
        min-width: auto;
        width: 100%;
      }
    }

    .doctor {
      color: $gray;
      font-size: 14px;
      background: rgba(33, 150, 243, 0.08);
      padding: 6px 12px;
      border-radius: $border-radius-xs;
      white-space: nowrap;

      @media (max-width: 768px) {
        font-size: 13px;
        padding: 5px 10px;
      }

      @media (max-width: 600px) {
        align-self: flex-start;
      }
    }
  }

  .visit-actions {
    button {
      font-weight: 500;
      border-radius: $border-radius-xs;
      padding: 8px 20px;
      transition: all 0.2s ease;
      min-width: 100px;

      @media (max-width: 768px) {
        padding: 7px 16px;
        min-width: 90px;
      }

      @media (max-width: 600px) {
        width: 100%;
      }

      &:hover {
        background: rgba(33, 150, 243, 0.1);
      }

      &.mat-primary {
        color: $primary;
        border: 1px solid rgba(33, 150, 243, 0.3);
      }
    }
  }
}

/* ================= VISIT DETAILS CARD ================= */
.visit-details-card {
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  .mat-card-header {
    background: linear-gradient(135deg, $light 0%, $gray-light 100%);
    
    .mat-card-title {
      font-size: 18px;
    }

    .mat-card-subtitle {
      color: $primary;
      font-weight: 500;
      margin-top: 4px;
      font-size: 14px;
    }
  }

  .mat-card-content {
    p {
      margin-bottom: 12px;
      color: #2c3e50;
      font-size: 15px;
      line-height: 1.5;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      strong {
        color: $dark;
        font-weight: 600;
        min-width: 160px;

        @media (max-width: 768px) {
          min-width: 140px;
        }

        @media (max-width: 480px) {
          min-width: 120px;
        }
      }

      @media (max-width: 480px) {
        flex-direction: column;
        gap: 4px;
      }
    }
  }

  .update-form {
    margin-top: 24px;
    padding: 24px;
    background: linear-gradient(135deg, $light 0%, $gray-light 100%);
    border-radius: $border-radius-sm;
    border: 1px solid rgba(33, 150, 243, 0.1);

    @media (max-width: 768px) {
      padding: 20px;
      margin-top: 20px;
    }

    @media (max-width: 480px) {
      padding: 16px;
      margin-top: 16px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 20px;

      @media (max-width: 480px) {
        margin-bottom: 16px;
      }

      ::ng-deep {
        .mat-form-field-outline {
          background: $white;
          border-radius: $border-radius-xs;
        }

        .mat-form-field-wrapper {
          padding-bottom: 0;
        }

        .mat-form-field-infix {
          padding: 12px 0;
          border-top: none;
        }

        .mat-form-field-label {
          color: $gray;
        }

        .mat-select-arrow {
          color: $primary;
        }
      }
    }

    textarea {
      resize: vertical;
      min-height: 100px;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.5;
    }
  }

  .mat-card-actions {
    padding: 20px 24px;
    border-top: 1px solid rgba(33, 150, 243, 0.1);
    display: flex;
    gap: 12px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      padding: 16px 20px;
      gap: 10px;
    }

    @media (max-width: 480px) {
      padding: 12px 16px;
      flex-direction: column;
    }

    button {
      font-weight: 500;
      border-radius: $border-radius-xs;
      padding: 10px 24px;
      transition: all 0.2s ease;
      font-size: 14px;

      @media (max-width: 768px) {
        padding: 9px 20px;
      }

      @media (max-width: 480px) {
        width: 100%;
        padding: 10px;
      }

      &.mat-primary {
        background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
        color: $white;
        border: none;

        &:hover {
          background: linear-gradient(135deg, $primary-dark 0%, #1565c0 100%);
          transform: translateY(-1px);
        }
      }

      &.mat-warn {
        background: linear-gradient(135deg, $danger 0%, #ff1744 100%);
        color: $white;
        border: none;

        &:hover {
          background: linear-gradient(135deg, #ff1744 0%, #d50000 100%);
          transform: translateY(-1px);
        }
      }

      &:not(.mat-primary):not(.mat-warn) {
        border: 1px solid rgba(33, 150, 243, 0.3);
        color: $primary;
        background: transparent;

        &:hover {
          background: rgba(33, 150, 243, 0.1);
        }
      }
    }
  }
}

/* ================= ANIMATIONS ================= */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ================= LOADING STATES ================= */
.loading {
  position: relative;
  pointer-events: none;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    border-radius: inherit;
    z-index: 1;
  }

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 40px;
    height: 40px;
    margin: -20px 0 0 -20px;
    border: 3px solid rgba(33, 150, 243, 0.2);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    z-index: 2;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ================= RESPONSIVE UTILITIES ================= */
.hidden-desktop {
  @media (min-width: 769px) {
    display: none !important;
  }
}

.hidden-mobile {
  @media (max-width: 768px) {
    display: none !important;
  }
}

.full-width-mobile {
  @media (max-width: 768px) {
    width: 100% !important;
  }
}

/* ================= PRINT STYLES ================= */
@media print {
  .dashboard-container {
    padding: 0;
    background: white;
  }

  .mat-card {
    box-shadow: none;
    border: 1px solid #ddd;
    page-break-inside: avoid;
  }

  button {
    display: none !important;
  }
}
`]
})
export class ReceptionDashboardComponent implements OnInit {
    private fb = inject(FormBuilder);
  private visitService = inject(VisitService);
  private router = inject(Router); // Add this line
  snackBar = inject(MatSnackBar); 
  visits: any = {};
  visitSummary: any = {};
  totalVisits = 0;
selectedVisit: any = null; // Visit selected for view/update/delete
visitForm!: FormGroup;      // Form for updating a visit
availableDoctors: any[] = [];
isUpdating = false;
recommendedPatients: any[] = [];

  ngOnInit(): void {
    this.loadTodayVisits();
  }

private loadTodayVisits(): void {
  this.visitService.getTodayVisits().subscribe({
    next: (response: any) => {
      if (response.success) {
        // Flatten and merge status for “Waiting for Nurse”
        this.visits = response.data;
        this.visits.waitingForNurse = [
          ...(this.visits.registered || []),
          ...(this.visits.waiting || [])
        ];
        this.visits.vitals_completed = response.data.vitals_completed || [];
        this.visitSummary = response.summary.byStatus;
        this.totalVisits = response.summary.total;
      } else {
        console.error('Failed to load visits:', response.message);
      }
    },
    error: (err) => {
      console.error('Error loading visits:', err);
      this.snackBar.open('Error loading visits', 'Close', { duration: 3000 });
    }
  });
}
createEmergencyAdmission() {
  this.router.navigate(['/reception/ip-admission'], {
    state: {
      source: 'RECEPTION'
    }
  });
}
updateVisit(): void {
  if (!this.selectedVisit || this.visitForm.invalid) return;

  this.isUpdating = true;
  const updatedData = this.visitForm.value;

  this.visitService.updateVisitStatus(this.selectedVisit._id, updatedData.visitStatus || this.selectedVisit.visitStatus)
    .subscribe({
      next: (res: any) => {
        this.snackBar.open(res.message || 'Visit updated', 'Close', { duration: 3000 });
        this.selectedVisit = null;
        this.loadTodayVisits();
        this.isUpdating = false;
      },
      error: (err) => {
        console.error('Error updating visit:', err);
        this.snackBar.open(err.error?.message || 'Error updating visit', 'Close', { duration: 3000 });
        this.isUpdating = false;
      }
    });
}
deleteVisit(visit: any): void {
  if (!confirm('Are you sure you want to delete this visit?')) return;

  this.visitService.deleteVisit(visit._id).subscribe({
    next: (res: any) => {
      this.snackBar.open(res.message || 'Visit deleted', 'Close', { duration: 3000 });
      this.selectedVisit = null;
      this.loadTodayVisits();
    },
    error: (err) => {
      console.error('Error deleting visit:', err);
      this.snackBar.open(err.error?.message || 'Error deleting visit', 'Close', { duration: 3000 });
    }
  });
}



  getStatusClass(status: string): string {
    return `status-${status}`;
  }

 viewVisit(visit: any): void {
  this.selectedVisit = visit;

  // Initialize the update form
  this.visitForm = this.fb.group({
    doctorId: [visit.doctor?._id || '', Validators.required],
    visitType: [visit.visitType || 'OP', Validators.required],
    priority: [visit.priority || 'Normal'],
    chiefComplaint: [visit.chiefComplaint || ''],
    shift: [visit.shift || 'Morning']
  });

  // Load doctors for assignment
  this.visitService.getDoctors().subscribe({
    next: (res: any) => {
      this.availableDoctors = res.data || [];
    },
    error: (err) => console.error(err)
  });
}

navigateToPatientRegister(): void {
  console.log('Navigating to patient registration...');
  this.router.navigate(['/reception/patient/register']);
}
  refreshVisits(): void {
    this.loadTodayVisits();
  }
}