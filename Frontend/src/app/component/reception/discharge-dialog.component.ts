import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { IpAdmissionService } from '../../service/ip-admission.service';

@Component({
  selector: 'app-discharge-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule
  ],
  template: `
    <div class="discharge-dialog">
      <h2 mat-dialog-title>Discharge Patient</h2>
      
      <mat-dialog-content>
        <div class="patient-info">
          <h3>{{ data.patient?.fullName }}</h3>
          <p>OP: {{ data.patient?.opNumber }} | 
             Bed: {{ data.bed?.bedNumber }} | 
             Room: {{ data.bed?.room?.roomNumber }}</p>
          <p>Admission Date: {{ data.visit?.admissionDate | date:'medium' }}</p>
        </div>
        
        <form [formGroup]="dischargeForm">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Discharge Summary</mat-label>
            <textarea matInput formControlName="dischargeSummary" 
                      rows="4" placeholder="Final diagnosis and discharge notes..." required></textarea>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Follow-up Instructions</mat-label>
            <textarea matInput formControlName="followUpInstructions" 
                      rows="3" placeholder="Follow-up care instructions..."></textarea>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Discharge Type</mat-label>
            <mat-select formControlName="dischargeType">
              <mat-option value="RECOVERED">Recovered</mat-option>
              <mat-option value="REFERRED">Referred</mat-option>
              <mat-option value="REQUESTED">Patient Requested</mat-option>
              <mat-option value="LAMA">Left Against Medical Advice (LAMA)</mat-option>
              <mat-option value="DECEASED">Deceased</mat-option>
            </mat-select>
          </mat-form-field>
          
          <!-- Billing Summary -->
          <div class="billing-summary" *ngIf="billingDetails">
            <h3>Billing Summary</h3>
            <div class="bill-item">
              <span>Room Charges ({{ billingDetails.stayDays }} days):</span>
              <span>₹{{ billingDetails.roomCharges }}</span>
            </div>
            <div class="bill-item" *ngFor="let item of billingDetails.otherCharges">
              <span>{{ item.description }}:</span>
              <span>₹{{ item.amount }}</span>
            </div>
            <div class="bill-item total">
              <strong>Total Amount:</strong>
              <strong>₹{{ billingDetails.totalAmount }}</strong>
            </div>
          </div>
        </form>
      </mat-dialog-content>
      
      <mat-dialog-actions>
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" 
                (click)="onDischarge()"
                [disabled]="dischargeForm.invalid">
          Complete Discharge
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .discharge-dialog { min-width: 600px; max-width: 800px; }
    .patient-info { 
      background: #f5f5f5; 
      padding: 15px; 
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .full-width { width: 100%; margin-bottom: 15px; }
    .billing-summary { 
      border: 1px solid #ddd; 
      padding: 15px; 
      border-radius: 8px;
      margin-top: 20px;
    }
    .bill-item { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px dashed #eee;
    }
    .bill-item.total { 
      border-top: 2px solid #333; 
      padding-top: 10px;
      margin-top: 10px;
    }
  `]
})
export class DischargeDialogComponent {
  private fb = inject(FormBuilder);
private ipAdmissionService = inject(IpAdmissionService);
  
  dischargeForm: FormGroup;
  billingDetails: any = null;

  constructor(
    public dialogRef: MatDialogRef<DischargeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.dischargeForm = this.fb.group({
      dischargeSummary: ['', Validators.required],
      followUpInstructions: [''],
      dischargeType: ['RECOVERED', Validators.required]
    });
    
    this.calculateBilling();
  }

private calculateBilling(): void {
  const admissionDate = new Date(this.data.visit?.admissionDate);
  const dischargeDate = new Date();
  const stayDays = Math.ceil((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const roomCharges = stayDays * (this.data.bed?.room?.chargesPerDay || 0);
  
  this.billingDetails = {
    stayDays: stayDays,
    roomCharges: roomCharges,
    otherCharges: [
      { description: 'Doctor Fees', amount: 500 },
      { description: 'Nursing Charges', amount: stayDays * 200 },
      { description: 'Medicines', amount: 1500 }
    ],
    totalAmount: 0
  };
  
  // Fix the reduce function with proper types
  this.billingDetails.totalAmount = this.billingDetails.roomCharges + 
    this.billingDetails.otherCharges.reduce((sum: number, item: any) => sum + item.amount, 0);
}

  onDischarge(): void {
  const dischargeData = {
    ...this.dischargeForm.value,
    dischargeDate: new Date(),
    billing: this.billingDetails
  };

  this.ipAdmissionService.dischargePatient({
    visitId: this.data.visit._id,
    ...dischargeData
  }).subscribe({
    next: (response: any) => {
      this.dialogRef.close({
        success: true,
        data: response.data,
        billing: this.billingDetails
      });
    },
    error: (err: any) => {
      console.error('Error discharging patient:', err);
    }
  });
}


  onCancel(): void {
    this.dialogRef.close();
  }
}