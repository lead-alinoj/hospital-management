import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { adminGuard, ipAdmissionGuard } from './auth/role.guard';
import { UnauthorizedComponent } from './auth/unauthorized/unauthorized.component';
import { PlaceholderComponent } from './shared/placeholder/placeholder.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { UserManagementComponent } from './component/user-management/user-management.component';
import { receptionGuard } from './auth/role.guard';
import { PatientRegistrationComponent } from './component/reception/patient-registration.component';
import { CreateVisitComponent } from './component/reception/create-visit.component';
import { ReceptionDashboardComponent } from './component/reception/reception-dashboard.component';
import { NurseDashboardComponent } from './component/nurse/nurse-dashboard.component';
import { VitalsEntryComponent } from './component/nurse/vitals-entry.component';
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
import { AttendanceHistoryComponent } from './component/Staff/attendance-history/attendance-history.component';
import { AttendanceEntryComponent } from './component/Staff/attendance-entry/attendance-entry.component';
import { StaffMasterComponent } from './component/Staff/staff-master/staff-master.component';
import { ShiftMasterComponent } from './component/Staff/shift-master/shift-master.component';
import { IpAdmissionComponent } from './component/IP/ip-admission.component';
import { IpDashboardComponent } from './component/IP/ip-dashboard.component';
import { BedManagementComponent } from './component/IP/bed-management.component';
import { CareUnitMasterComponent } from './component/IP/care-unit-master.component';
import { MainLayoutComponent } from './component/layout/main-layout.component';
import { VitalsViewComponent } from './component/nurse/vitals -view.component';
import { IpRecommendationDialogComponent } from './component/doctor/ip-recommendation-dialog.component';
import { IpServiceBillComponent } from './component/IP/ip-service-bill.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  // Public routes - No layout
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

  // ========== PROTECTED ROUTES WITH MAIN LAYOUT ==========
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      // ========== ADMIN ROUTES ==========
      {
        path: 'admin/dashboard',
        component: AdminDashboardComponent,
        canActivate: [adminGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'admin/shift-master',
        component: ShiftMasterComponent,
        canActivate: [adminGuard],
        data: { roles: ['Admin'] }
      },

      {
        path: 'admin/hospital',
        component: HospitalSettingsComponent,
        canActivate: [adminGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'admin/reports',
        component: PlaceholderComponent,
        canActivate: [adminGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'admin/users',
        component: UserManagementComponent,
        canActivate: [adminGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'admin/appointments',
        component: AdminAppointmentsComponent,
        canActivate: [adminGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'admin/staff',
        component: StaffMasterComponent,
        canActivate: [adminGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'admin/attendance',
        component: AttendanceEntryComponent,
        canActivate: [adminGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'admin/attendance/history',
        component: AttendanceHistoryComponent,
        canActivate: [adminGuard],
        data: { roles: ['Admin'] }
      },

      // ========== DOCTOR ROUTES ==========
      {
        path: 'doctor/dashboard',
        component: DoctorDashboardComponent,
        data: { roles: ['Doctor'] }
      },
      {
        path: 'doctor/consultation/:visitId',
        component: ConsultationComponent,
        data: { roles: ['Doctor'] }
      },
      {
        path: 'doctor/patients',
        component: DoctorDashboardComponent,
        data: { roles: ['Doctor'] }
      },
   

      // ========== NURSE ROUTES ==========
      {
        path: 'nurse/dashboard',
        component: NurseDashboardComponent,
        data: { roles: ['Nurse'] }
      },
      {
        path: 'nurse/vitals/:visitId',
        component: VitalsEntryComponent,
        data: { roles: ['Nurse'] }
      },
      {
        path: 'nurse/vitalshistory',
        component: VitalsHistoryComponent,
        data: { roles: ['Nurse'] }
      },
      {
        path: 'nurse/vitals/view/:visitId',
        component: VitalsViewComponent,
        data: { roles: ['Nurse'] }
      },

      // ========== RECEPTION ROUTES ==========
      {
        path: 'reception/staff',
        component: StaffMasterComponent,
        data: { roles: ['Admin', 'Reception'] }
      },
      {
  path: 'reception/attendance/history',
  component: AttendanceHistoryComponent,
  data: { roles: ['Admin', 'Reception'] }
},

      {
  path: 'reception/shift-master',
  component: ShiftMasterComponent,
  data: { roles: ['Admin', 'Reception'] }
},
{
  path: 'reception/appointments',
  component: AdminAppointmentsComponent,
  data: { roles: ['Admin', 'Reception'] }
},


      {
        path: 'reception/attendance',
        component: AttendanceEntryComponent,
  data: { roles: ['Admin', 'Reception'] }
      },
      {
        path: 'reception/dashboard',
        component: ReceptionDashboardComponent,
        data: { roles: ['Admin', 'Reception'] }
      },
      {
        path: 'reception/patient/register',
        component: PatientRegistrationComponent,
        data: { roles: ['Admin', 'Reception'] }
      },
      {
        path: 'reception/visit/create',
        component: CreateVisitComponent,
        data: { roles: ['Admin', 'Reception'] }
      },
      {
        path: 'reception/patient/search',
        component: PatientSearchComponent,
  data: { roles: ['Admin', 'Reception', 'Nurse'] }
      },
      {
  path: 'reception/hospital',
  component: HospitalSettingsComponent,
  data: { roles: ['Admin', 'Reception'] }
},

      {
        path: 'reception/ip-admission',
canActivate: [ipAdmissionGuard],
        component: IpAdmissionComponent,
  data: { roles: ['Admin', 'Reception', 'Pharmacy'] }
      },

      // ========== PHARMACY ROUTES ==========
      {
        path: 'pharmacy/dashboard',
        component: PharmacyDashboardComponent,
        data: { roles: ['Pharmacy'] }
      },
      {
        path: 'pharmacy/medicines',
        component: MedicineManagementComponent,
  data: { roles: ['Admin', 'Reception', 'Pharmacy'] }
      },
      {
  path: 'pharmacy/attendance',
  component: AttendanceEntryComponent,
  data: { roles: ['Pharmacy'] }
},
      {
        path: 'pharmacy/categories',
        component: CategoryManagementComponent,
  data: { roles: ['Admin', 'Reception', 'Pharmacy'] }
      },

      // ========== COMMON ROUTES ==========
      {
        path: 'ip-dashboard',
        component: IpDashboardComponent,
        
        data: { roles: ['Admin', 'Doctor', 'Nurse', 'Reception', 'Pharmacy'] }
      },
     
 // Admin
{
  path: 'admin/care-units',
  component: CareUnitMasterComponent,
  canActivate: [adminGuard],
  data: { roles: ['Admin'] }
},

// Reception
{
  path: 'reception/care-units',
  component: CareUnitMasterComponent,
  canActivate: [receptionGuard],
  data: { roles: ['Admin', 'Reception'] }
},

// Nurse
{
  path: 'nurse/care-units',
  component: CareUnitMasterComponent,
  data: { roles: ['Nurse'] }
},
// Pharmacy
{
  path: 'pharmacy/care-units',
  component: CareUnitMasterComponent,
  data: { roles: ['Pharmacy'] }
},

// Admin
{
  path: 'admin/beds',
  component: BedManagementComponent,
  canActivate: [adminGuard],
  data: { roles: ['Admin'] }
},

// Reception
{
  path: 'reception/beds',
  component: BedManagementComponent,
  canActivate: [receptionGuard],
  data: { roles: ['Admin', 'Reception'] }
},

// Nurse (view only)
{
  path: 'nurse/beds',
  component: BedManagementComponent,
  data: { roles: ['Nurse'] }
},
// Pharmacy (view / manage)
{
  path: 'pharmacy/beds',
  component: BedManagementComponent,
  data: { roles: ['Pharmacy'] }
},


      {
        path: 'vitals/history/:patientId',
        component: VitalsHistoryComponent,
        data: { roles: ['Nurse', 'Doctor'] }
      },
{
  path: 'ip-service-bill',
  component: IpServiceBillComponent,
  data: { roles: ['Doctor', 'Nurse', 'Reception', 'Admin'] }
}
      // Default redirect
      // {
      //   path: '',
      //   redirectTo: 'dashboard',
      //   pathMatch: 'full'
      // }
    ]
  },

  // Wildcard route
  {
    path: '**',
    redirectTo: ''
  }
];