import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { UserRole } from '../../models/user.model';
import { HeaderComponent } from '../header/header.component';

interface SidebarMenuItem {
  icon: string;
  label: string;
  route: string;
  roles: UserRole[];
  badgeCount?: number;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    MatBadgeModule,
    MatMenuModule,
    HeaderComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Sidebar state
  isSidebarOpen = true;
  isMobileView = false;
  
  // User information
  userRole: UserRole | null = null;
  userName = '';
  
  // Notification count
  notificationCount = 0;

  // Sidebar menu items (Updated to match your routes)
  sidebarMenuItems: SidebarMenuItem[] = [
    // Admin specific
    {
      icon: 'dashboard',
      label: 'Admin Dashboard',
      route: '/admin/dashboard',
      roles: ['Admin']
    },
    {
      icon: 'people',
      label: 'Staff Management',
      route: '/admin/staff',
      roles: ['Admin']
    },
    {
      icon: 'schedule',
      label: 'Shift Master',
      route: '/admin/shift-master',
      roles: ['Admin']
    },
    {
      icon: 'check_circle',
      label: 'Attendance',
      route: '/admin/attendance',
      roles: ['Admin']
    },
    {
      icon: 'history',
      label: 'Attendance History',
      route: '/admin/attendance/history',
      roles: ['Admin']
    },
    {
      icon: 'settings',
      label: 'Hospital Settings',
      route: '/admin/hospital',
      roles: ['Admin']
    },
    {
      icon: 'event',
      label: 'Appointments',
      route: '/admin/appointments',
      roles: ['Admin']
    },
    {
      icon: 'manage_accounts',
      label: 'User Management',
      route: '/admin/users',
      roles: ['Admin']
    },
    
    // Doctor specific
    {
      icon: 'dashboard',
      label: 'Doctor Dashboard',
      route: '/doctor/dashboard',
      roles: ['Doctor']
    },
    {
      icon: 'people',
      label: 'My Patients',
      route: '/doctor/patients',
      roles: ['Doctor']
    },
    
    // Nurse specific
    {
      icon: 'dashboard',
      label: 'Nurse Dashboard',
      route: '/nurse/dashboard',
      roles: ['Nurse']
    },
    {
      icon: 'monitor_heart',
      label: 'Vitals',
      route: '/nurse/vitalshistory',
      roles: ['Nurse']
    },
    
    // Reception specific
    {
      icon: 'dashboard',
      label: 'Reception Dashboard',
      route: '/reception/dashboard',
      roles: ['Reception']
    },
    {
      icon: 'person_add',
      label: 'Patient Registration',
      route: '/reception/patient/register',
      roles: ['Reception']
    },
    {
      icon: 'event_available',
      label: 'Create Visit',
      route: '/reception/visit/create',
      roles: ['Reception']
    },
    {
      icon: 'search',
      label: 'Patient Search',
      route: '/reception/patient/search',
      roles: ['Reception']
    },
    {
      icon: 'people',
      label: 'Staff',
      route: '/reception/staff',
      roles: ['Reception']
    },
    {
      icon: 'check_circle',
      label: 'Attendance',
      route: '/reception/attendance',
      roles: ['Reception']
    },
    
    // Pharmacy specific
    {
      icon: 'dashboard',
      label: 'Pharmacy Dashboard',
      route: '/pharmacy/dashboard',
      roles: ['Pharmacy']
    },
    {
      icon: 'inventory_2',
      label: 'Medicine Management',
      route: '/pharmacy/medicines',
      roles: ['Pharmacy']
    },
    {
      icon: 'category',
      label: 'Category Management',
      route: '/pharmacy/categories',
      roles: ['Pharmacy']
    },
    
    // IP Management (common for multiple roles)
    {
      icon: 'hotel',
      label: 'IP Dashboard',
      route: '/ip-dashboard',
      roles: ['Admin', 'Doctor', 'Nurse', 'Reception', 'Pharmacy']
    },
 // Admin IP Admission
{
  icon: 'hotel',
  label: 'IP Admission',
  route: '/ip-admission',
  roles: ['Admin']
},



// Reception IP Admission ✅
{
  icon: 'hotel',
  label: 'IP Admission',
  route: '/reception/ip-admission',
  roles: ['Reception']
},

  // ===== CARE UNITS =====

// Admin
{
  icon: 'domain',
  label: 'Care Units',
  route: '/admin/care-units',
  roles: ['Admin']
},
// Reception
{
  icon: 'domain',
  label: 'Care Units',
  route: '/reception/care-units',
  roles: ['Reception']
},
// Nurse
{
  icon: 'domain',
  label: 'Care Units',
  route: '/nurse/care-units',
  roles: ['Nurse']
},

// ===== BED MANAGEMENT =====

// Admin
{
  icon: 'hotel',
  label: 'Bed Management',
  route: '/admin/beds',
  roles: ['Admin']
},
// Reception
{
  icon: 'hotel',
  label: 'Bed Management',
  route: '/reception/beds',
  roles: ['Reception']
},
// Nurse
{
  icon: 'hotel',
  label: 'Bed Status',
  route: '/nurse/beds',
  roles: ['Nurse']
},

  ];

  // Filtered menu items for current user role
  filteredMenuItems: SidebarMenuItem[] = [];

  ngOnInit(): void {
    this.checkViewport();
    
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.userRole = this.authService.getUserRole();
      this.userName = this.authService.getDisplayName();
      this.filterMenuItems();
    });

    // Handle responsive breakpoints
    this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.Tablet
    ]).subscribe(result => {
      this.isMobileView = result.matches;
      if (this.isMobileView) {
        this.isSidebarOpen = false;
      } else {
        this.isSidebarOpen = true;
      }
    });

    // Close sidebar on mobile navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobileView) {
          this.isSidebarOpen = false;
        }
      });

    // Simulate notification count
    this.loadNotifications();
  }

  private checkViewport(): void {
    this.isMobileView = window.innerWidth < 768;
    if (this.isMobileView) {
      this.isSidebarOpen = false;
    }
  }

  private filterMenuItems(): void {
    if (!this.userRole) {
      this.filteredMenuItems = [];
      return;
    }
    
    this.filteredMenuItems = this.sidebarMenuItems.filter(item => 
      item.roles.includes(this.userRole as UserRole)
    );
  }

  private loadNotifications(): void {
    setTimeout(() => {
      this.notificationCount = 3;
    }, 1000);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkViewport();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebarOnMobile(): void {
    if (this.isMobileView) {
      this.isSidebarOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const sidebar = document.querySelector('.sidebar');
    const burgerButton = document.querySelector('.burger-button');
    
    if (this.isMobileView && 
        this.isSidebarOpen && 
        sidebar && 
        !sidebar.contains(target) && 
        burgerButton && 
        !burgerButton.contains(target)) {
      this.isSidebarOpen = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}