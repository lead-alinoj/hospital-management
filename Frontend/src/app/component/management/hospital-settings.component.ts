import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HospitalService } from '../../service/hospital.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-hospital-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="hospital-settings">
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>local_hospital</mat-icon>
            Hospital Settings
          </mat-card-title>
          <mat-card-subtitle>
            Manage hospital information for prescriptions and reports
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="hospitalForm" (ngSubmit)="saveHospital()" *ngIf="!isLoading">
            <div class="form-grid">
              <!-- Basic Information -->
              <div class="form-section">
                <h3>Basic Information</h3>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Hospital Name *</mat-label>
                  <input matInput formControlName="name" placeholder="Enter hospital name">
                  <mat-icon matSuffix>business</mat-icon>
                  <mat-error *ngIf="hospitalForm.get('name')?.hasError('required')">
                    Hospital name is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Address *</mat-label>
                  <textarea matInput formControlName="address" rows="2" 
                    placeholder="Full address"></textarea>
                  <mat-icon matSuffix>location_on</mat-icon>
                  <mat-error *ngIf="hospitalForm.get('address')?.hasError('required')">
                    Address is required
                  </mat-error>
                </mat-form-field>

                <div class="row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>City *</mat-label>
                    <input matInput formControlName="city" placeholder="City">
                    <mat-error *ngIf="hospitalForm.get('city')?.hasError('required')">
                      City is required
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>State *</mat-label>
                    <input matInput formControlName="state" placeholder="State">
                    <mat-error *ngIf="hospitalForm.get('state')?.hasError('required')">
                      State is required
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Pincode *</mat-label>
                    <input matInput formControlName="pincode" placeholder="Pincode">
                    <mat-error *ngIf="hospitalForm.get('pincode')?.hasError('required')">
                      Pincode is required
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Phone *</mat-label>
                    <input matInput formControlName="phone" placeholder="Phone number">
                    <mat-icon matSuffix>phone</mat-icon>
                    <mat-error *ngIf="hospitalForm.get('phone')?.hasError('required')">
                      Phone is required
                    </mat-error>
                  </mat-form-field>
                </div>
              </div>

              <!-- Contact & Registration -->
              <div class="form-section">
                <h3>Contact & Registration</h3>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" type="email" placeholder="Email address">
                  <mat-icon matSuffix>email</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Registration Number</mat-label>
                  <input matInput formControlName="registrationNumber" 
                    placeholder="Hospital registration number">
                  <mat-icon matSuffix>badge</mat-icon>
                </mat-form-field>

                <!-- Logo Upload -->
                <div class="logo-upload-section">
                  <h4>Hospital Logo</h4>
                  
                  <div class="logo-preview" *ngIf="logoPreview">
                    <img [src]="logoPreview" alt="Hospital Logo" class="logo-image">
                  </div>
                  
                  <div class="upload-controls">
                    <input type="file" #fileInput 
                      (change)="onFileSelected($event)"
                      accept=".jpg,.jpeg,.png,.gif"
                      hidden>
                    
                    <button mat-raised-button type="button" 
                      (click)="fileInput.click()"
                      color="primary">
                      <mat-icon>upload</mat-icon>
                      Upload Logo
                    </button>
                    
                    <div class="upload-hint">
                      <small>Recommended: 200x200px, PNG or JPG, Max 2MB</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Preview Section -->
            <div class="preview-section" *ngIf="hospitalForm.valid">
              <h3>Letterhead Preview</h3>
              <mat-card class="letterhead-preview">
                <div class="letterhead-content">
                  <div class="hospital-header">
                      <img *ngIf="logoPreview"
       [src]="logoPreview"
       class="letterhead-logo"
       alt="Hospital Logo">
                    <h2>{{ hospitalForm.value.name }}</h2>
                    <p>{{ hospitalForm.value.address }}</p>
                    <p>{{ hospitalForm.value.city }}, {{ hospitalForm.value.state }} - {{ hospitalForm.value.pincode }}</p>
                    <p>Phone: {{ hospitalForm.value.phone }}</p>
                    <p *ngIf="hospitalForm.value.email">Email: {{ hospitalForm.value.email }}</p>
                    <p *ngIf="hospitalForm.value.registrationNumber">
                      Reg. No: {{ hospitalForm.value.registrationNumber }}
                    </p>
                  </div>
                  <div class="prescription-header">
                    <h3>PRESCRIPTION</h3>
                  </div>
                </div>
              </mat-card>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button mat-button type="button" (click)="resetForm()">Reset</button>
              <button mat-raised-button color="primary" type="submit" 
                [disabled]="hospitalForm.invalid || isSaving">
                <mat-icon *ngIf="!isSaving">save</mat-icon>
                <mat-spinner diameter="20" *ngIf="isSaving"></mat-spinner>
                {{ isSaving ? 'Saving...' : 'Save Hospital Settings' }}
              </button>
            </div>
          </form>

          <!-- Loading State -->
          <div class="loading-state" *ngIf="isLoading">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Loading hospital settings...</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .hospital-settings {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .settings-card {
      margin-bottom: 30px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 30px;
      margin-bottom: 30px;
    }
    @media (max-width: 1100px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
    .letterhead-logo {
  max-width: 120px;
  max-height: 120px;
  margin-bottom: 10px;
  object-fit: contain;
}

    .form-section {
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .form-section h3 {
      margin-top: 0;
      color: #3f51b5;
      border-bottom: 2px solid #3f51b5;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    .half-width {
      width: calc(50% - 10px);
    }
    .row {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
    }
    .logo-upload-section {
      margin-top: 20px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      border: 2px dashed #ddd;
    }
    .logo-upload-section h4 {
      margin-top: 0;
      color: #666;
    }
    .logo-preview {
      text-align: center;
      margin-bottom: 20px;
    }
    .logo-image {
      max-width: 150px;
      max-height: 150px;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px;
      background: white;
    }
    .upload-controls {
      text-align: center;
    }
    .upload-hint {
      margin-top: 10px;
      color: #666;
    }
    .preview-section {
      margin-top: 30px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .letterhead-preview {
      background: white;
      padding: 30px;
      border: 1px solid #ddd;
    }
    .letterhead-content {
      text-align: center;
    }
    .hospital-header h2 {
      color: #3f51b5;
      margin-bottom: 10px;
    }
    .hospital-header p {
      margin: 5px 0;
      color: #555;
    }
    .prescription-header h3 {
      color: #333;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #3f51b5;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .loading-state {
      text-align: center;
      padding: 50px;
    }
    .loading-state p {
      margin-top: 20px;
      color: #666;
    }
    @media (max-width: 768px) {
      .row {
        flex-direction: column;
      }
      .half-width {
        width: 100%;
      }
      .form-section {
        padding: 15px;
      }
    }
  `]
})
export class HospitalSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hospitalService = inject(HospitalService);
  private snackBar = inject(MatSnackBar);

  hospitalForm!: FormGroup;
  logoPreview: string | null = null;
  selectedFile: File | null = null;
  isLoading = false;
  isSaving = false;

  ngOnInit(): void {
    this.initForm();
    this.loadHospitalData();
  }

  private initForm(): void {
    this.hospitalForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.email]],
      registrationNumber: [''],
      // logo: ['']
    });
  }

  private loadHospitalData(): void {
    this.isLoading = true;
    
    this.hospitalService.getHospital().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const hospital = response.data;
          
          // Patch form values
          this.hospitalForm.patchValue({
            name: hospital.name || '',
            address: hospital.address || '',
            city: hospital.city || '',
            state: hospital.state || '',
            pincode: hospital.pincode || '',
            phone: hospital.phone || '',
            email: hospital.email || '',
            registrationNumber: hospital.registrationNumber || ''
          });

          // Set logo preview if exists
          if (hospital.logo) {
this.logoPreview = `${this.getServerBaseUrl()}${hospital.logo}`;
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading hospital data:', error);
        this.showError('Failed to load hospital settings');
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      this.showError('Please select a valid image file (JPEG, PNG, GIF)');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.showError('File size should be less than 2MB');
      return;
    }

    this.selectedFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
private getServerBaseUrl(): string {
  return environment.apiUrl.replace('/api', '');
}

  saveHospital(): void {
    if (this.hospitalForm.invalid) {
      this.showError('Please fill all required fields correctly');
      return;
    }

    this.isSaving = true;

    // First upload logo if selected
    if (this.selectedFile) {
      this.hospitalService.uploadLogo(this.selectedFile).subscribe({
        next: (response) => {
          if (response.success) {
            const timestamp = Date.now();
this.logoPreview = `${this.getServerBaseUrl()}${response.data.logo}?t=${timestamp}`;

            // Continue with saving hospital data
            this.saveHospitalData();
          } else {
            this.isSaving = false;
            this.showError('Failed to upload logo');
          }
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Error uploading logo:', error);
          this.showError('Error uploading logo');
        }
      });
    } else {
      // Save hospital data without logo upload
      this.saveHospitalData();
    }
  }

  private saveHospitalData(): void {
    const hospitalData = this.hospitalForm.value;
    
    this.hospitalService.updateHospital(hospitalData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Hospital settings saved successfully!');
          
          // Reset file selection
          this.selectedFile = null;
        } else {
          this.showError('Failed to save hospital settings');
        }
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving hospital data:', error);
        this.showError('Error saving hospital settings');
        this.isSaving = false;
      }
    });
  }

  resetForm(): void {
    this.hospitalForm.reset();
    this.logoPreview = null;
    this.selectedFile = null;
    this.loadHospitalData();
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}