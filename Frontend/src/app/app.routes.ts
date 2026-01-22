import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './auth/role.guard';
import { UnauthorizedComponent } from './auth/unauthorized/unauthorized.component';
import { PlaceholderComponent } from './shared/placeholder/placeholder.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { UserManagementComponent } from './component/user-management/user-management.component';
import { receptionGuard  } from './auth/role.guard';
import { PatientRegistrationComponent } from './component/reception/patient-registration.component';
import { CreateVisitComponent } from './component/reception/create-visit.component';
import { ReceptionDashboardComponent } from './component/reception/dashboard.component';
import { NurseDashboardComponent } from './component/nurse/nurse-dashboard.component';
import { VitalsEntryComponent } from './component/nurse/vitals-entry.component';
import { VitalsViewComponent } from './component/nurse/vitals -view.component';
import { VitalsHistoryComponent } from './component/nurse/vitals-history.component';
import { DoctorDashboardComponent } from './component/doctor/doctor-dashboard.component';
import { ConsultationComponent } from './component/doctor/consultation.component';
import { HospitalSettingsComponent } from './component/management/hospital-settings.component';
import { MedicineManagementComponent } from './component/management/medicine-management.component';
import { PharmacyDashboardComponent } from './component/pharmacy-dashboard/pharmacy-dashboard.component';
import { CategoryManagementComponent } from './component/management/category-management.component';
import { PatientSearchComponent } from './component/reception/patient-search.component';
import { LandingComponent } from './pages/landing/landing.component';
import { AdminAppointmentsComponent } from './pages/appointments/appointments.component';

export const routes: Routes = [
  // Empty path redirects to login
 {
    path: '',
    component: LandingComponent
  },

  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: 'register', 
    component: RegisterComponent 
  },
  { 
    path: 'unauthorized', 
    component: UnauthorizedComponent 
  },
  
  // ========== PROTECTED ROUTES (Require login) ==========
  
  // Admin routes
  {
    path: 'admin/dashboard',
    component: PlaceholderComponent,
    canActivate: [authGuard, adminGuard],
    data: { title: 'Admin Dashboard', message: 'Admin dashboard coming soon' }
  },
  {
  path: 'admin/hospital',
  component: HospitalSettingsComponent,
  // canActivate: [authGuard],
  data: { roles: ['Admin'] }
},
  {
    path: 'admin/reports',
    component: PlaceholderComponent,
    canActivate: [authGuard, adminGuard],
    data: { title: 'Reports', message: 'Reports module coming soon' }
  },
  {
    path: 'admin/users',
    component: UserManagementComponent,
    canActivate: [authGuard, adminGuard],
    data: { title: 'User Management', message: 'User management coming soon' }
  },
  {
  path: 'admin/appointments',
  component: AdminAppointmentsComponent,
  canActivate: [authGuard, adminGuard], // Only accessible by admin
  data: { title: 'Appointments' }
},
  
  // Doctor routes
{
  path: 'doctor/dashboard',
  component: DoctorDashboardComponent,
  canActivate: [authGuard],
  data: { role: 'Doctor' }
},
{
  path: 'doctor/consultation/:visitId',
  component: ConsultationComponent,
  canActivate: [authGuard],
  data: { role: 'Doctor' }
},

  { 
    path: 'doctor/patients', 
      component: DoctorDashboardComponent,
    canActivate: [authGuard],
    data: { title: 'My Patients', message: 'Patient management coming soon' }
  },
  
  // Nurse routes
  { 
    path: 'nurse/dashboard', 
    component: NurseDashboardComponent,
    canActivate: [authGuard],
    data: { role: 'Nurse' }
  },
   {
    path: 'nurse/vitals/:visitId',
    component: VitalsEntryComponent, // Use the existing vitals component
    canActivate: [authGuard],
    data: { role: 'Nurse' }
  },
   {
    path: 'vitals/history/:patientId',
    component: VitalsHistoryComponent , // You might want to create a view-only component
    // canActivate: [authGuard],
    data: { role: 'Nurse' }
  },
  {
    path: 'nurse/vitals/view/:visitId',
    component: VitalsViewComponent, // You might want to create a view-only component
    canActivate: [authGuard],
    data: { role: 'Nurse' }
  },
  // Reception routes
  {
   path: 'reception',
       canActivate: [authGuard], // Add authentication guard

    children: [
      { path: 'dashboard', component: ReceptionDashboardComponent},
      { path: 'patient/register', component: PatientRegistrationComponent }, // This is the missing route
      { path: 'visit/create', component: CreateVisitComponent },
      { path: 'patient/search', component: PatientSearchComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  // Pharmacy routes
 {
  path: 'pharmacy/dashboard',
  component: PharmacyDashboardComponent,
  canActivate: [authGuard],
  data: { roles: ['Pharmacy', 'Admin'] }
},
{
  path: 'pharmacy/medicines',
  component: MedicineManagementComponent,
  canActivate: [authGuard],
  data: { roles: ['Pharmacy', 'Admin'] }
},
{
  path: 'pharmacy/categories',
  component: CategoryManagementComponent, // Make sure to import this component
  canActivate: [authGuard],
  data: { roles: ['Pharmacy', 'Admin'] }
},
  // Wildcard route - redirect to login
  {
    path: '**',
    redirectTo: ''
  }
];