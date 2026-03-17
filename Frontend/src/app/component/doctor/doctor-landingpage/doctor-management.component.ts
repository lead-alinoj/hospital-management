import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DoctorService, Doctor } from '../../../service/doctor.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-doctor-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './doctor-management.component.html',
  styleUrls: ['./doctor-management.component.scss']
})
export class DoctorManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private doctorService = inject(DoctorService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  doctorForm: FormGroup;
  doctors: Doctor[] = [];
  loading = false;
  editingDoctor: Doctor | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor() {
    this.doctorForm = this.fb.group({
      name: ['', Validators.required],
      specialty: ['', Validators.required],
      experience: ['', [Validators.required, Validators.min(0)]],
      qualification: ['', Validators.required],
      image: ['']
    });
  }

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.loading = true;
    this.doctorService.getDoctors().subscribe({
      next: (response) => {
        if (response.success) {
          this.doctors = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.showMessage('Error loading doctors');
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  clearFile(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    const fileInput = document.getElementById('doctorImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  resetForm(): void {
    this.doctorForm.reset();
    this.editingDoctor = null;
    this.clearFile();
  }

  cancelEdit(): void {
    this.resetForm();
  }

  onSubmit(): void {
    if (this.doctorForm.invalid) return;

    const formData = new FormData();
    formData.append('name', this.doctorForm.get('name')?.value);
    formData.append('specialty', this.doctorForm.get('specialty')?.value);
    formData.append('experience', this.doctorForm.get('experience')?.value);
    formData.append('qualification', this.doctorForm.get('qualification')?.value);
    
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    } else if (this.doctorForm.get('image')?.value) {
      formData.append('image', this.doctorForm.get('image')?.value);
    }

    if (this.editingDoctor) {
      this.updateDoctor(formData);
    } else {
      this.createDoctor(formData);
    }
  }

  createDoctor(formData: FormData): void {
    this.loading = true;
    this.doctorService.createDoctor(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage('Doctor added successfully');
          this.resetForm();
          this.loadDoctors();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating doctor:', error);
        this.showMessage('Error creating doctor');
        this.loading = false;
      }
    });
  }

  updateDoctor(formData: FormData): void {
    if (!this.editingDoctor?._id) return;
    
    this.loading = true;
    this.doctorService.updateDoctor(this.editingDoctor!._id, formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage('Doctor updated successfully');
          this.resetForm();
          this.loadDoctors();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error updating doctor:', error);
        this.showMessage('Error updating doctor');
        this.loading = false;
      }
    });
  }

  editDoctor(doctor: Doctor): void {
    this.editingDoctor = doctor;
    this.doctorForm.patchValue({
      name: doctor.name,
      specialty: doctor.specialty,
      experience: doctor.experience,
      qualification: doctor.qualification,
      image: doctor.image
    });
    
    // Set image preview if exists
    if (doctor.image) {
      this.imagePreview = this.getImageUrl(doctor.image);
    }
  }

  deleteDoctor(doctor: Doctor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Delete',
        message: `Are you sure you want to delete Dr. ${doctor.name}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && doctor._id) {
        this.loading = true;
        this.doctorService.deleteDoctor(doctor._id).subscribe({
          next: (response) => {
            if (response.success) {
              this.showMessage('Doctor deleted successfully');
              this.loadDoctors();
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error deleting doctor:', error);
            this.showMessage('Error deleting doctor');
            this.loading = false;
          }
        });
      }
    });
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/images/default-doctor.jpg';
    if (imagePath.startsWith('http') || imagePath.startsWith('assets/') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${imagePath}`;
  }

  showMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}