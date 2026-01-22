import { Component, OnInit, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd, Event } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { UserRole } from '../../models/user.model';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Authentication status
  isLoggedIn = signal(false);
  
  // Mobile menu state
  isMenuOpen = false;
  isMobileView = false;
  
  // User information
  userName = '';
  userRole: UserRole | null = null;

  // Unauthorized warning state
  showUnauthorizedWarning = false;
  unauthorizedMessage = '';

// In header.component.ts, update the ngOnInit method:

ngOnInit(): void {
  this.checkMobileView();
  
  // Subscribe to user changes
  this.authService.currentUser$.subscribe(user => {
    this.isLoggedIn.set(!!user);
    this.userName = this.authService.getDisplayName();
    this.userRole = this.authService.getUserRole();
  });

  // Fix this subscription:
  this.router.events
    .pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    )
    .subscribe((event: NavigationEnd) => {
      this.checkRouteAuthorization(event.urlAfterRedirects);
    });
}

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobileView();
  }

  private checkMobileView(): void {
    this.isMobileView = window.innerWidth < 768;
    if (!this.isMobileView) {
      this.isMenuOpen = false;
    }
  }

  private checkRouteAuthorization(url: string): void {
    // Check if user is trying to access unauthorized route
    if (this.isLoggedIn()) {
      const role = this.userRole;
      const isAuthorized = this.isRouteAuthorizedForRole(url, role);
      
      if (!isAuthorized && !url.includes('/unauthorized')) {
        this.showUnauthorizedWarning = true;
        this.unauthorizedMessage = `Your role (${role}) does not have access to this page.`;
        
        // Show snackbar warning
        this.snackBar.open(this.unauthorizedMessage, 'Dismiss', {
          duration: 5000,
          verticalPosition: 'top',
          panelClass: ['unauthorized-snackbar']
        });

        // Auto-redirect after 5 seconds
        setTimeout(() => {
          this.redirectToDashboard();
        }, 5000);
      } else {
        this.showUnauthorizedWarning = false;
      }
    }
  }

  private isRouteAuthorizedForRole(url: string, role: UserRole | null): boolean {
    if (!role) return false;

    // Define role-based route patterns
    const roleRoutes: Record<UserRole, RegExp[]> = {
      'Admin': [
        /^\/admin\/.*$/,
        /^\/reports\/.*$/,
        /^\/management\/.*$/,
         /^\/pharmacy\/.*$/
      ],
      'Doctor': [
        /^\/doctor\/.*$/,
        /^\/patients\/.*$/,
        /^\/appointments\/.*$/,
        /^\/prescriptions\/.*$/
      ],
      'Nurse': [
        /^\/nurse\/.*$/,
        /^\/ward\/.*$/,
        /^\/vitals\/.*$/,
        /^\/medication\/.*$/
      ],
      'Reception': [
  /^\/reception(\/|;|\?|$).*/,
          /^\/patients\/register.*$/,
        /^\/appointments\/book.*$/,
        /^\/billing\/.*$/,
     
      ],
      'Pharmacy': [
        /^\/pharmacy\/.*$/,
        /^\/inventory\/.*$/,
        /^\/prescriptions\/dispense.*$/,
         /^\/pharmacy\/categories.*$/ 
      ]
    };

    // Check common routes accessible by all logged-in users
    const commonRoutes = [
      /^\/profile$/,
      /^\/settings$/,
      /^\/notifications$/,
      /^\/messages$/,
      /^\/$/
    ];

    // Check common routes first
    if (commonRoutes.some(pattern => pattern.test(url))) {
      return true;
    }

    // Check role-specific routes
    const allowedRoutes = roleRoutes[role] || [];
    return allowedRoutes.some(pattern => pattern.test(url));
  }

  // Role check methods
  isAdmin(): boolean {
    return this.authService.hasRole('Admin');
  }

  isDoctor(): boolean {
    return this.authService.hasRole('Doctor');
  }

  isNurse(): boolean {
    return this.authService.hasRole('Nurse');
  }

  isReception(): boolean {
    return this.authService.hasRole('Reception');
  }

  isPharmacy(): boolean {
    return this.authService.hasRole('Pharmacy');
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMobileMenuOnNavigation(): void {
    if (this.isMobileView) {
      this.isMenuOpen = false;
    }
  }

  navigateToDashboard(): void {
    const dashboardRoute = this.authService.getDashboardRoute();
    this.router.navigate([dashboardRoute]);
    this.closeMobileMenuOnNavigation();
  }

  redirectToDashboard(): void {
    this.showUnauthorizedWarning = false;
    this.navigateToDashboard();
  }

  closeWarning(): void {
    this.showUnauthorizedWarning = false;
  }
logout(): void {
  this.authService.logout();

  // ✅ Close any open dialogs (important if login dialog was used)
  this.dialog.closeAll();

  // ✅ Navigate to Landing page
  this.router.navigate(['/']);

  this.closeMobileMenuOnNavigation();
}

  getRoleColor(role: UserRole | null): string {
    switch(role) {
      case 'Admin': return 'primary';
      case 'Doctor': return 'accent';
      case 'Nurse': return 'warn';
      case 'Reception': return '';
      case 'Pharmacy': return 'primary';
      default: return '';
    }
  }

  getRoleIcon(role: UserRole | null): string {
    switch(role) {
      case 'Admin': return 'admin_panel_settings';
      case 'Doctor': return 'medical_services';
      case 'Nurse': return 'medication';
      case 'Reception': return 'desk';
      case 'Pharmacy': return 'local_pharmacy';
      default: return 'person';
    }
  }

  getRoleBadgeClass(role: UserRole | null): string {
    switch(role) {
      case 'Admin': return 'role-badge-admin';
      case 'Doctor': return 'role-badge-doctor';
      case 'Nurse': return 'role-badge-nurse';
      case 'Reception': return 'role-badge-reception';
      case 'Pharmacy': return 'role-badge-pharmacy';
      default: return '';
    }
  }

  // Quick action methods
  openNotifications(): void {
    this.router.navigate(['/notifications']);
    this.closeMobileMenuOnNavigation();
  }

  openMessages(): void {
    this.router.navigate(['/messages']);
    this.closeMobileMenuOnNavigation();
  }

  openProfile(): void {
    this.router.navigate(['/profile']);
    this.closeMobileMenuOnNavigation();
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
    this.closeMobileMenuOnNavigation();
  }
}