// user-management.component.ts - Fixed version
import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../auth/auth.service';
import { User, UserRole } from '../../models/user.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { ResetPasswordDialogComponent } from './reset-password-dialog.component';
import { AddUserDialogComponent } from './add-user-form.component'; // FIXED: Changed from './add-user-dialog.component'
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<User>([]);
  displayedColumns: string[] = ['name', 'role', 'specialization', 'status', 'createdAt', 'actions'];
  loading = false;
  roles: UserRole[] = ['Admin', 'Doctor', 'Reception', 'Nurse', 'Pharmacy'];
  statuses: string[] = ['Active', 'Inactive', 'Pending', 'Blocked'];
  
  editForm!: FormGroup;
  editingUserId: string | null = null;

  // Filter properties
  roleFilter = '';
  statusFilter = '';
  searchFilter = '';

  ngOnInit(): void {
    this.initializeForm();
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

// In user-management.component.ts - Update the initializeForm method
private initializeForm(): void {
  this.editForm = this.fb.group({
    role: ['', Validators.required],
    status: ['', Validators.required],
    specialization: [{ value: '', disabled: true }] // Start disabled
  });

  // Subscribe to role changes
  this.editForm.get('role')?.valueChanges.subscribe(role => {
    const spec = this.editForm.get('specialization');
    if (role === 'Doctor') {
      spec?.setValidators([Validators.required]);
      spec?.enable();
    } else {
      spec?.clearValidators();
      spec?.setValue('');
      spec?.disable();
    }
    spec?.updateValueAndValidity();
  });
}

  getDisplayName(user: User): string {
    if (user.role === 'Doctor') {
      return `Dr. ${user.name}` + (user.specialization ? ` — ${user.specialization}` : '');
    }
    return user.name;
  }

  loadUsers(): void {
    console.log('Loading users...');
    console.log('Current token:', this.authService.getToken());
    console.log('Current user role:', this.authService.getUserRole());

    this.loading = true;

    this.authService.getAllUsers().subscribe({
      next: (response: any) => {
        console.log('Users response:', response);
        if (response.success) {
          // Map _id to id for the frontend
          const users = response.data.map((u: any) => ({
            ...u,
            id: u._id || u.id, // Handle both _id and id
            status: u.status || (u.isActive ? 'Active' : 'Inactive'),
            specialization: u.specialization || null // Ensure specialization is included
          }));
          this.dataSource.data = users;
          console.log('Users loaded:', users.length);
          
          // Apply any existing filters
          this.applyFilters();
        } else {
          console.error('API returned success: false', response);
          this.snackBar.open('Failed to load users: Invalid response from server', 'Close', {
            duration: 5000,
            verticalPosition: 'top'
          });
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        const errorMessage = error.error?.error || error.message || 'Unknown error';
        this.snackBar.open('Failed to load users: ' + errorMessage, 'Close', {
          duration: 5000,
          verticalPosition: 'top'
        });
        this.loading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchFilter = filterValue.trim().toLowerCase();
    this.applyFilters();
  }

  filterByRole(): void {
    this.applyFilters();
  }

  filterByStatus(): void {
    this.applyFilters();
  }

applyFilters(): void {
  // Update the filter predicate
  this.dataSource.filterPredicate = (data: User, filter: string) => {
    // Ensure we always return a boolean, not string or other types
    const matchesSearch = !this.searchFilter || 
      (data.name && data.name.toLowerCase().includes(this.searchFilter)) ||
      (data.email && data.email.toLowerCase().includes(this.searchFilter));
    
    // Use == instead of === for null/undefined safety, or explicitly check for null
    const matchesRole = !this.roleFilter || data.role === this.roleFilter;
    const matchesStatus = !this.statusFilter || data.status === this.statusFilter;
    
    // Ensure all conditions return boolean
    return Boolean(matchesSearch && matchesRole && matchesStatus);
  };
  
  // Apply the filter
  this.dataSource.filter = 'trigger';
  
  if (this.dataSource.paginator) {
    this.dataSource.paginator.firstPage();
  }
}

  clearFilters(): void {
    this.roleFilter = '';
    this.statusFilter = '';
    this.searchFilter = '';
    this.applyFilters();
  }

  // Add User Dialog
  openAddUserDialog(): void {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '500px',
      data: { roles: this.roles }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.authService.createUser(result).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open('User created successfully', 'Close', {
                duration: 3000,
                verticalPosition: 'top'
              });
              this.loadUsers();
            } else {
              this.snackBar.open(response.error || 'Failed to create user', 'Close', {
                duration: 3000,
                verticalPosition: 'top'
              });
            }
            this.loading = false;
          },
          error: (error: any) => {
            this.snackBar.open(error.error?.error || 'Failed to create user', 'Close', {
              duration: 3000,
              verticalPosition: 'top'
            });
            this.loading = false;
          }
        });
      }
    });
  }

// In user-management.component.ts - Update the startEdit method
startEdit(user: User): void {
  this.editingUserId = user.id;
  this.editForm.patchValue({
    role: user.role,
    status: user.status,
    specialization: user.specialization || ''
  });
  
  // IMPORTANT: Enable specialization field if user is a doctor
  const specControl = this.editForm.get('specialization');
  if (user.role === 'Doctor') {
    specControl?.enable();
  } else {
    specControl?.disable();
  }
}
  cancelEdit(): void {
    this.editingUserId = null;
    this.editForm.reset();
  }
// In user-management.component.ts - Update the updateUser method
updateUser(): void {
  if (this.editForm.invalid || !this.editingUserId) {
    return;
  }

  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    data: {
      title: 'Update User',
      message: 'Are you sure you want to update this user?'
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      const updates = this.editForm.value;
      
      // If role is being changed FROM Doctor to something else, clear specialization
      // If role is being changed TO Doctor and specialization is empty, set default
      if (updates.role !== 'Doctor') {
        updates.specialization = null; // Clear specialization if not a doctor
      } else if (!updates.specialization) {
        updates.specialization = 'General'; // Default specialization for doctors
      }
      
      this.loading = true;
      
      this.authService.updateUser(this.editingUserId!, updates).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.snackBar.open('User updated successfully', 'Close', {
              duration: 3000,
              verticalPosition: 'top'
            });
            this.loadUsers();
            this.cancelEdit();
          } else {
            this.snackBar.open(response.error || 'Failed to update user', 'Close', {
              duration: 3000,
              verticalPosition: 'top'
            });
          }
          this.loading = false;
        },
        error: (error: any) => {
          this.snackBar.open(error.error?.error || 'Failed to update user', 'Close', {
            duration: 3000,
            verticalPosition: 'top'
          });
          this.loading = false;
        }
      });
    }
  });
}
  blockUser(user: User): void {
    const action = user.status === 'Blocked' ? 'unblock' : 'block';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
        message: `Are you sure you want to ${action} this user?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        const blocked = user.status !== 'Blocked';
        
        this.authService.blockUser(user.id, blocked).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open(`User ${action}ed successfully`, 'Close', {
                duration: 3000,
                verticalPosition: 'top'
              });
              this.loadUsers();
            } else {
              this.snackBar.open(response.error || `Failed to ${action} user`, 'Close', {
                duration: 3000,
                verticalPosition: 'top'
              });
            }
            this.loading = false;
          },
          error: (error: any) => {
            this.snackBar.open(error.error?.error || `Failed to ${action} user`, 'Close', {
              duration: 3000,
              verticalPosition: 'top'
            });
            this.loading = false;
          }
        });
      }
    });
  }

  // Reset Password
  resetPassword(user: User): void {
    const dialogRef = this.dialog.open(ResetPasswordDialogComponent, {
      data: { userName: user.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.authService.resetUserPassword(user.id, result.newPassword).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open('Password reset successfully', 'Close', {
                duration: 3000,
                verticalPosition: 'top'
              });
            } else {
              this.snackBar.open(response.error || 'Failed to reset password', 'Close', {
                duration: 3000,
                verticalPosition: 'top'
              });
            }
            this.loading = false;
          },
          error: (error: any) => {
            this.snackBar.open(error.error?.error || 'Failed to reset password', 'Close', {
              duration: 3000,
              verticalPosition: 'top'
            });
            this.loading = false;
          }
        });
      }
    });
  }

  // Activate/Deactivate User
  toggleUserStatus(user: User): void {
    const action = user.isActive ? 'deactivate' : 'activate';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Confirm ${action}`,
        message: `Are you sure you want to ${action} this user?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        
        this.authService.toggleUserActive(user.id, !user.isActive).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open(`User ${action}d successfully`, 'Close', {
                duration: 3000,
                verticalPosition: 'top'
              });
              this.loadUsers();
            } else {
              this.snackBar.open(response.error || `Failed to ${action} user`, 'Close', {
                duration: 3000,
                verticalPosition: 'top'
              });
            }
            this.loading = false;
          },
          error: (error: any) => {
            const errorMessage = error.error?.error || `Failed to ${action} user`;
            this.snackBar.open(errorMessage, 'Close', {
              duration: 3000,
              verticalPosition: 'top'
            });
            this.loading = false;
          }
        });
      }
    });
  }

  // Delete User
  deleteUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete user ${user.name}? This action cannot be undone.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.authService.deleteUser(user.id).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open('User deleted successfully', 'Close', {
                duration: 3000,
                verticalPosition: 'top'
              });
              this.loadUsers();
            } else {
              this.snackBar.open(response.error || 'Failed to delete user', 'Close', {
                duration: 3000,
                verticalPosition: 'top'
              });
            }
            this.loading = false;
          },
          error: (error: any) => {
            this.snackBar.open(error.error?.error || 'Failed to delete user', 'Close', {
              duration: 3000,
              verticalPosition: 'top'
            });
            this.loading = false;
          }
        });
      }
    });
  }

  isEditing(userId: string): boolean {
    return this.editingUserId === userId;
  }

  // Helper methods for statistics
  getTotalUsers(): number {
    return this.dataSource.filteredData?.length || 0;
  }

  getActiveUsers(): number {
    return this.dataSource.filteredData?.filter(user => user.status === 'Active').length || 0;
  }

  getInactiveUsers(): number {
    return this.dataSource.filteredData?.filter(user => user.status === 'Inactive').length || 0;
  }

  getBlockedUsers(): number {
    return this.dataSource.filteredData?.filter(user => user.status === 'Blocked').length || 0;
  }

 formatDate(dateValue?: string | Date): string {
  if (!dateValue) return 'N/A';

  const date =
    typeof dateValue === 'string'
      ? new Date(dateValue)
      : dateValue;

  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}


  getRoleColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
      'Admin': 'primary',
      'Doctor': 'accent',
      'Reception': 'warn',
      'Nurse': 'primary',
      'Pharmacy': 'accent'
    };
    return colors[role] || '';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active': return 'primary';
      case 'Inactive': return 'accent';
      case 'Pending': return '';
      case 'Blocked': return 'warn';
      default: return '';
    }
  }

exportUsers(): void {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Title
  doc.setFontSize(18);
  doc.text('User Management Report', 14, 15);

  // Subtitle
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

  const columns = [
    { header: 'Name', dataKey: 'name' },
    { header: 'Email', dataKey: 'email' },
    { header: 'Role', dataKey: 'role' },
    { header: 'Specialization', dataKey: 'specialization' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Registered Date', dataKey: 'createdAt' }
  ];

  const rows = this.dataSource.filteredData.map(user => ({
    name: user.role === 'Doctor'
      ? `Dr. ${user.name ?? ''}`
      : user.name ?? '',
    email: user.email ?? '',
    role: user.role ?? '',
    specialization: user.specialization ?? '-',
    status: user.status ?? '',
    createdAt: this.formatDate(user.createdAt)
  }));

  autoTable(doc, {
    columns,
    body: rows,
    startY: 28,
    theme: 'striped',
    headStyles: {
      fillColor: [34, 36, 46],
      textColor: [255, 255, 255],
      fontSize: 11
    },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 }
  });

  const pageCount = (doc as any).internal.pages.length - 1;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 30,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save(`users-report-${Date.now()}.pdf`);

  this.snackBar.open('Users exported as PDF', 'Close', {
    duration: 3000,
    verticalPosition: 'top'
  });
}
}