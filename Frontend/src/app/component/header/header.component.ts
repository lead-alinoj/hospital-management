import { Component, OnInit, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { UserRole } from '../../models/user.model';
import { Output, EventEmitter } from '@angular/core';

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
  @Output() toggleSidebar = new EventEmitter<void>();

  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  isLoggedIn = signal(false);
  isMenuOpen = false;
  isMobileView = false;
  userName = '';
  userRole: UserRole | null = null;
  showUnauthorizedWarning = false;
  unauthorizedMessage = '';

  ngOnInit(): void {
    this.checkMobileView();
    
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn.set(!!user);
      this.userName = this.authService.getDisplayName();
      this.userRole = this.authService.getUserRole();
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (!this.userRole) return;
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
    if (this.isLoggedIn()) {
      const role = this.userRole;
      const isAuthorized = this.isRouteAuthorizedForRole(url, role);
      
      if (!isAuthorized && !url.includes('/unauthorized')) {
        this.showUnauthorizedWarning = true;
        this.unauthorizedMessage = `Your role (${role}) does not have access to this page.`;
        
        this.snackBar.open(this.unauthorizedMessage, 'Dismiss', {
          duration: 5000,
          verticalPosition: 'top',
          panelClass: ['unauthorized-snackbar']
        });

       
      } else {
        this.showUnauthorizedWarning = false;
      }
    }
  }

  private isRouteAuthorizedForRole(url: string, role: UserRole | null): boolean {
    if (!role) return false;

    const roleRoutes: Record<UserRole, RegExp[]> = {
      'Admin': [
        /^\/admin\/.*$/,
        /^\/reports\/.*$/,
        /^\/management\/.*$/,
        /^\/pharmacy\/.*$/,
        /^\/admin\/staff$/,
        /^\/admin\/attendance$/,
        /^\/admin\/attendance\/history$/,
         /^\/pharmacy\/medicines$/,
  /^\/pharmacy\/categories$/,
  /^\/pharmacy\/.*$/,
      ],
      'Doctor': [
        /^\/doctor\/.*$/,
        /^\/patients\/.*$/,
        /^\/appointments\/.*$/,
        /^\/prescriptions\/.*$/,
        /^\/ip-dashboard.*$/
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
        /^\/reception\/staff$/,
          /^\/reception\/shift-master.*$/,
          /^\/reception\/hospital.*$/,
        /^\/pharmacy\/medicines$/,
          /^\/reception\/beds.*$/,
          /^\/reception\/care-units.*$/,
  /^\/pharmacy\/categories$/,
    /^\/reception\/appointments.*$/,
  /^\/pharmacy\/categories.*$/,

        /^\/reception\/attendance$/,
        /^\/reception\/ip-admission.*$/,   // ✅ IMPORTANT
  /^\/ip-dashboard.*$/               // ✅ optional but good
      ],
      'Pharmacy': [
        /^\/pharmacy\/.*$/,
        /^\/inventory\/.*$/,
        /^\/prescriptions\/dispense.*$/,
        /^\/pharmacy\/categories.*$/,
          /^\/pharmacy\/beds.*$/,
  /^\/pharmacy\/care-units.*$/,
  /^\/pharmacy\/staff.*$/,
  /^\/pharmacy\/attendance.*$/,
  /^\/pharmacy\/medicines.*$/,
  /^\/pharmacy\/categories.*$/,
  /^\/ip-dashboard.*$/ 
      ]
    };

    const commonRoutes = [
      /^\/profile$/,
      /^\/settings$/,
      /^\/notifications$/,
      /^\/messages$/,
      /^\/$/,
      /^\/ip-dashboard.*$/
    ];

    if (commonRoutes.some(pattern => pattern.test(url))) {
      return true;
    }

    const allowedRoutes = roleRoutes[role] || [];
    return allowedRoutes.some(pattern => pattern.test(url));
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.toggleSidebar.emit();
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
    this.dialog.closeAll();
    this.router.navigate(['/']);
    this.closeMobileMenuOnNavigation();
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

  openProfile(): void {
    this.router.navigate(['/profile']);
    this.closeMobileMenuOnNavigation();
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
    this.closeMobileMenuOnNavigation();
  }
}