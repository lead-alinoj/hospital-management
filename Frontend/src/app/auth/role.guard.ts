import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';

export const hmsRoleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const snackBar = inject(MatSnackBar);

    if (!authService.isAuthenticated()) {
      snackBar.open('Please login to access this page', 'Close', {
        duration: 3000,
        verticalPosition: 'top'
      });
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    snackBar.open('You do not have permission to access this page', 'Close', {
      duration: 3000,
      verticalPosition: 'top'
    });
    
    // Redirect to appropriate dashboard
    const dashboardRoute = authService.getDashboardRoute();
    router.navigate([dashboardRoute]);
    return false;
  };
};

// Individual role guards for convenience
export const adminGuard = hmsRoleGuard(['Admin']);
export const doctorGuard = hmsRoleGuard(['Doctor']);
export const nurseGuard = hmsRoleGuard(['Nurse']);
export const receptionGuard = hmsRoleGuard(['Reception']);
export const pharmacyGuard = hmsRoleGuard(['Pharmacy']);

// Combined role guards
export const medicalStaffGuard = hmsRoleGuard(['Doctor', 'Nurse']);
export const adminReceptionGuard = hmsRoleGuard(['Admin', 'Reception']);