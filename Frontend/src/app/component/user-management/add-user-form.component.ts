// add-user-dialog.component.ts - Fixed version
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Add New User</h2>
    <mat-dialog-content>
      <form [formGroup]="addUserForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Full Name</mat-label>
          <input matInput formControlName="name" placeholder="Enter full name">
          <mat-error *ngIf="name?.hasError('required')">
            Name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" placeholder="Enter email">
          <mat-icon matSuffix>email</mat-icon>
          <mat-error *ngIf="email?.hasError('required')">
            Email is required
          </mat-error>
          <mat-error *ngIf="email?.hasError('email')">
            Invalid email format
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Password</mat-label>
          <input matInput formControlName="password" type="password" placeholder="Enter password">
          <mat-error *ngIf="password?.hasError('required')">
            Password is required
          </mat-error>
          <mat-error *ngIf="password?.hasError('minlength')">
            Minimum 6 characters required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Confirm Password</mat-label>
          <input matInput formControlName="confirmPassword" type="password" placeholder="Confirm password">
          <mat-error *ngIf="confirmPassword?.hasError('required')">
            Please confirm password
          </mat-error>
          <mat-error *ngIf="addUserForm.hasError('passwordMismatch') && confirmPassword?.touched">
            Passwords do not match
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option *ngFor="let role of data.roles" [value]="role">
              {{ role }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="role?.hasError('required')">
            Role is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width"
  *ngIf="addUserForm.get('role')?.value === 'Doctor'">
  <mat-label>Doctor Specialization</mat-label>
  <input matInput formControlName="specialization"
         placeholder="Eg: Cardiology, Orthopedics">
  <mat-error *ngIf="addUserForm.get('specialization')?.hasError('required')">
    Specialization is required for doctors
  </mat-error>
</mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="Active">Active</mat-option>
            <mat-option value="Inactive">Inactive</mat-option>
            <mat-option value="Pending">Pending</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="addUserForm.invalid"
              (click)="onSubmit()">
        Add User
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 16px; }
    mat-dialog-content { min-width: 400px; }
  `]
})
export class AddUserDialogComponent {
  addUserForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { roles: UserRole[] }
  ) {
    this.addUserForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
       specialization: [{ value: '', disabled: true }],
      role: ['', Validators.required],
      status: ['Active']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.addUserForm.valid) {
      const { confirmPassword, ...userData } = this.addUserForm.value;
      this.dialogRef.close(userData);
    }
  }

  get name() { return this.addUserForm.get('name'); }
  get email() { return this.addUserForm.get('email'); }
  get password() { return this.addUserForm.get('password'); }
  get confirmPassword() { return this.addUserForm.get('confirmPassword'); }
  get role() { return this.addUserForm.get('role'); }
  get status() { return this.addUserForm.get('status'); }
}