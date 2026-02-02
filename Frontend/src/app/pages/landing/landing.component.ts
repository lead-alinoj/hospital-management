import { Component } from '@angular/core';
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
    MatMenuModule
],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  appointmentForm: FormGroup;
hours = Array.from({length: 12}, (_, i) => i + 1); // 1-12
  
  constructor(private fb: FormBuilder, private appointmentService: AppointmentService,private dialog: MatDialog, public authService: AuthService) {
    this.appointmentForm = this.fb.group({
      patientName: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', Validators.email], // Optional
      description: ['', Validators.required],
      appointmentDate: ['', Validators.required],
        hour: [''],   // optional
      ampm: [''],   // optional
    });
  }

openAuthDialog(type: 'login' | 'register') {
  const component: ComponentType<any> =
    type === 'login' ? LoginComponent : RegisterComponent;

  this.dialog.open(component, {
    width: '420px',
    panelClass: 'custom-login-dialog',
    backdropClass: 'login-backdrop',
    disableClose: false
  });
}

submitAppointment() {
  if (this.appointmentForm.valid) {
    const formValue = this.appointmentForm.value;

    // ✅ OPTIONAL time logic
    if (formValue.hour && formValue.ampm) {
      formValue.appointmentTime = `${formValue.hour}:00 ${formValue.ampm}`;
    } else {
      formValue.appointmentTime = null; // ✅ better than empty string
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
