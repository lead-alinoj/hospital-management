import { Component, OnInit, Inject, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppointmentService } from '../../service/appointment.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from "@angular/material/select";
import { RouterModule } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../../auth/login/login.component';
import { MatMenuModule } from "@angular/material/menu";
import { RegisterComponent } from '../../auth/register/register.component';
import { ComponentType } from '@angular/cdk/portal';
import { AuthService } from '../../auth/auth.service';
import { DOCUMENT } from '@angular/common';
import { DoctorService, Doctor } from '../../service/doctor.service';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    CommonModule,
    MatSelectModule,
    RouterModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressSpinnerModule
],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  appointmentForm: FormGroup;
  hours = Array.from({length: 12}, (_, i) => i + 1); // 1-12

  mobileMenuOpen = false;

    doctors: Doctor[] = [];
  loadingDoctors = true;

  testimonials = [
    {
      name: 'Ramesh Kumar',
      text: 'Excellent care and professional staff. The doctors are very knowledgeable and took time to explain everything.',
      rating: 5,
      patientType: 'Cardiology Patient'
    },
    {
      name: 'Saraswathi Devi',
      text: 'I had a great experience with the general medicine department. The treatment was successful and recovery was quick.',
      rating: 5,
      patientType: 'Orthopedic Patient'
    },
    {
      name: 'Venkatesh Prasad',
      text: 'The emergency response was quick and efficient. Thank you for saving my father\'s life.',
      rating: 5,
      patientType: 'Emergency Patient'
    }
  ];

  constructor(
    private fb: FormBuilder, 
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private dialog: MatDialog, 
    public authService: AuthService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.appointmentForm = this.fb.group({
      patientName: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', Validators.email],
      description: ['', Validators.required],
      appointmentDate: ['', Validators.required],
      hour: [''],
      ampm: [''],
    });
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    
    // Prevent body scroll when mobile menu is open
    if (this.mobileMenuOpen) {
      this.document.body.style.overflow = 'hidden';
    } else {
      this.document.body.style.overflow = 'auto';
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // Close mobile menu on window resize above 768px
    if (event.target.innerWidth > 768 && this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
      this.document.body.style.overflow = 'auto';
    }
  }

  ngOnInit() {
      this.loadDoctors(); // ADD THIS LINE

    // Ensure body has proper overflow
    this.document.body.style.overflow = 'auto';
    this.document.body.style.height = 'auto';
    this.document.documentElement.style.overflow = 'auto';
    this.document.documentElement.style.height = 'auto';
  }
loadDoctors() {
    this.loadingDoctors = true;
    this.doctorService.getDoctors().subscribe({
      next: (response) => {
         console.log('Doctors loaded:', response); 
        if (response.success) {
          this.doctors = response.data;
        }
        this.loadingDoctors = false;
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.loadingDoctors = false;
      }
    });
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      // Close mobile menu after clicking
      if (this.mobileMenuOpen) {
        this.mobileMenuOpen = false;
        this.document.body.style.overflow = 'auto';
      }

      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  openAuthDialog(type: 'login' | 'register') {
    const component: ComponentType<any> =
      type === 'login' ? LoginComponent : RegisterComponent;

    this.dialog.open(component, {
      width: '420px',
      panelClass: 'custom-login-dialog',
      backdropClass: 'login-backdrop',
      disableClose: false,
      maxWidth: '95vw',
      maxHeight: '100vh'
    });
  }
// Add this method to your LandingComponent class
getImageUrl(imagePath: string): string {
  if (!imagePath) return 'assets/images/default-doctor.jpg';
  if (imagePath.startsWith('http') || imagePath.startsWith('assets/')) {
    return imagePath;
  }
  // Remove /api from the URL to get base URL
  const baseUrl = environment.apiUrl.replace('/api', '');
  return `${baseUrl}${imagePath}`;
}
  submitAppointment() {
    if (this.appointmentForm.valid) {
      const formValue = this.appointmentForm.value;

      if (formValue.hour && formValue.ampm) {
        formValue.appointmentTime = `${formValue.hour}:00 ${formValue.ampm}`;
      } else {
        formValue.appointmentTime = null;
      }

      console.log('Sending payload:', formValue);

      this.appointmentService.createAppointment(formValue).subscribe({
        next: () => {
          alert('Appointment booked successfully!');
          this.appointmentForm.reset();
        },
        error: err => console.error(err)
      });
    }
  }
}