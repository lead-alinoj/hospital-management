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
  route?: string;
  roles: UserRole[];
  children?: SidebarMenuItem[];
    expanded?: boolean;   // ✅ ADD THIS LINE

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

  // DASHBOARDS
  {
    icon: 'dashboard',
    label: 'Dashboard',
    route: '/admin/dashboard',
    roles: ['Admin']
  },
  // {
  //   icon: 'dashboard',
  //   label: 'Dashboard',
  //   route: '/doctor/placeholder',
  //   roles: ['Doctor']
  // },
  {
  icon: 'people',
  label: 'My Patients',
  route: '/doctor/dashboard',
  roles: ['Doctor']
},

  {
    icon: 'dashboard',
    label: 'Dashboard',
    route: '/nurse/dashboard',
    roles: ['Nurse']
  },
  {
    icon: 'dashboard',
    label: 'Dashboard',
    route: '/reception/dashboard',
    roles: ['Reception']
  },
  {
    icon: 'dashboard',
    label: 'Dashboard',
    route: '/pharmacy/dashboard',
    roles: ['Pharmacy']
  },

  // ================= PATIENT =================
{
  icon: 'person',
  label: 'Patient',
  roles: ['Admin', 'Reception'],
  children: [
    {
      icon: 'person_add',
      label: 'Patient Registration',
      route: '/reception/patient/register',
      roles: ['Admin', 'Reception']
    },
    {
      icon: 'event_available',
      label: 'Create Visit',
      route: '/reception/visit/create',
      roles: ['Admin', 'Reception']
    },
    {
      icon: 'search',
      label: 'Patient Search',
      route: '/reception/patient/search',
      roles: ['Admin', 'Reception']
    }
  ]
}
,

  // ================= STAFF =================
 {
  icon: 'groups',
  label: 'Staff',
  roles: ['Admin', 'Reception'],
  children: [
    // Admin
    {
  icon: 'manage_accounts',
  label: 'User Management',
  route: '/admin/users',
  roles: ['Admin']
},

    {
      icon: 'people',
      label: 'Staff Management',
      route: '/admin/staff',
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
      icon: 'schedule',
      label: 'Shift Master',
      route: '/admin/shift-master',
      roles: ['Admin']
    },
{
  icon: 'check_circle',
  label: 'Attendance',
  route: '/pharmacy/attendance',
  roles: ['Pharmacy']
},

    // Reception
    {
      icon: 'people',
      label: 'Staff Management',
      route: '/reception/staff',
      roles: ['Reception']
    },
    {
      icon: 'check_circle',
      label: 'Attendance',
      route: '/reception/attendance',
      roles: ['Reception']
    },
    {
      icon: 'schedule',
      label: 'Shift Master',
      route: '/reception/shift-master',
      roles: ['Reception']
    },
    {
  icon: 'history',
  label: 'Attendance History',
  route: '/reception/attendance/history',
  roles: ['Reception']
}

  ]
},


  // ================= MANAGEMENT =================
  
  {
  icon: 'settings',
  label: 'Management',
  roles: ['Admin', 'Reception', 'Pharmacy'],
  children: [
    {
      icon: 'inventory_2',
      label: 'Medicine Management',
      route: '/pharmacy/medicines',
      roles: ['Admin', 'Reception', 'Pharmacy']
    },
    {
      icon: 'category',
      label: 'Category Management',
      route: '/pharmacy/categories',
      roles: ['Admin', 'Reception', 'Pharmacy']
    },

    // Admin
    {
      icon: 'hotel',
      label: 'Bed Management',
      route: '/admin/beds',
      roles: ['Admin']
    },
    {
      icon: 'domain',
      label: 'Care Units',
      route: '/admin/care-units',
      roles: ['Admin']
    },
{
  icon: 'hotel',
  label: 'Bed Management',
  route: '/pharmacy/beds',
  roles: ['Pharmacy']
},
{
  icon: 'domain',
  label: 'Care Units',
  route: '/pharmacy/care-units',
  roles: ['Pharmacy']
},

    // Reception
    {
      icon: 'hotel',
      label: 'Bed Management',
      route: '/reception/beds',
      roles: ['Reception']
    },
    {
      icon: 'domain',
      label: 'Care Units',
      route: '/reception/care-units',
      roles: ['Reception']
    },
     {
      icon: 'local_hospital',
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
      icon: 'local_hospital',
      label: 'Hospital Settings',
      route: '/reception/hospital',
      roles: ['Reception']
    },
    {
      icon: 'event',
      label: 'Appointments',
      route: '/reception/appointments',
      roles: ['Reception']
    }

    ]
  },

  // ================= IP =================
  {
    icon: 'hotel',
    label: 'IP Dashboard',
    route: '/ip-dashboard',
    roles: ['Admin', 'Doctor', 'Nurse', 'Reception', 'Pharmacy']
  },
  {
    icon: 'hotel',
    label: 'IP Admission',
  route: '/reception/ip-admission',
    roles: ['Admin']
  },
  {
    icon: 'hotel',
    label: 'IP Admission',
    route: '/reception/ip-admission',
    roles: ['Reception']
  }

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
    
  this.filteredMenuItems = this.sidebarMenuItems
  .filter(item => item.roles.includes(this.userRole as UserRole))
  .map(item => ({
    ...item,
    children: item.children
      ? item.children.filter(child =>
          child.roles.includes(this.userRole as UserRole)
        )
      : undefined
    }));
    
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