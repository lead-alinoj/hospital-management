import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Staff } from '../../../models/staff.model';
import { StaffService } from '../../../service/staff.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-staff-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule,
    MatCardModule,
    MatToolbarModule,
    MatMenuModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './staff-master.component.html',
  styleUrls: ['./staff-master.component.scss']
})
export class StaffMasterComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  staffForm: FormGroup;
  staffList: Staff[] = [];
  filteredStaff: Staff[] = [];
  displayedColumns: string[] = ['staffId', 'name', 'jobRole', 'phone', 'salary', 'status', 'createdDate', 'actions'];
  dataSource = new MatTableDataSource<Staff>();
roles: ('None' | 'Admin' | 'Reception' | 'Doctor' | 'Nurse' | 'Pharmacy')[] = [
  'None',
  'Admin',
  'Reception',
  'Doctor',
  'Nurse',
  'Pharmacy'
];
  statuses = ['Active', 'Inactive'];
  
  isEditing = false;
  selectedStaff: Staff | null = null;
  isLoading = false;
  searchQuery = '';
  selectedRole = '';
  selectedStatus = '';

  constructor(
    private staffService: StaffService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.staffForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      jobRole: ['', Validators.required],

  // ✅ OPTIONAL
  systemRole: ['None'],

      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
salary: [0, [Validators.min(0)]],
      status: ['Active', Validators.required],
      notes: [''],
      gender: [''],
  joiningDate: [null],
  address: [''],
  qualification: [''],
  salaryType: ['Monthly'],

  bankDetails: this.fb.group({
    accountNumber: [''],
    ifsc: [''],
    bankName: ['']
  }),

  idProof: this.fb.group({
    type: [''],
    number: ['']
  }),
    });
  }

  ngOnInit(): void {
    this.loadStaff();
  }

loadStaff(): void {
  this.isLoading = true;

  const filters: any = {};
  if (this.selectedRole) filters.systemRole = this.selectedRole;
  if (this.selectedStatus) filters.status = this.selectedStatus;

  this.staffService.getAllStaff(filters)
    .pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: (response) => {
        this.staffList = response.data;
        this.filteredStaff = [...this.staffList];

        // ✅ VERY IMPORTANT
        this.dataSource.data = this.filteredStaff;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (error) => {
        console.error('Staff load failed:', error);
      }
    });
}


viewStaff(staff: Staff): void {
  this.dialog.open(ConfirmDialogComponent, {
    width: '500px',
    data: {
      title: 'Staff Details',
      message: `
        Name: ${staff.name}
Role: ${staff.systemRole ?? 'None'}
Job Role: ${staff.jobRole}
        Phone: ${staff.phone}
        Gender: ${staff.gender || '-'}
        Qualification: ${staff.qualification || '-'}
        Status: ${staff.status}
      `,
      confirmText: 'Close',
      hideCancel: true
    }
  });
}

  applyFilter(): void {
    const filterValue = this.searchQuery.toLowerCase();
    this.filteredStaff = this.staffList.filter(staff => 
      staff.name.toLowerCase().includes(filterValue) ||
      staff.staffId.toLowerCase().includes(filterValue) ||
      staff.phone.includes(filterValue)
    );
    this.dataSource.data = this.filteredStaff;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onSearch(): void {
    this.applyFilter();
  }

  onFilterChange(): void {
    this.loadStaff();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.loadStaff();
  }

  addStaff(): void {
    this.isEditing = false;
    this.selectedStaff = null;
    this.staffForm.reset({
      name: '',
systemRole: 'None',
  jobRole: '',
        phone: '',
      salary: 0,
      status: 'Active',
      notes: ''
    });
  }

  editStaff(staff: Staff): void {
    this.isEditing = true;
    this.selectedStaff = staff;
 this.staffForm.patchValue({
  systemRole: staff.systemRole,
  jobRole: staff.jobRole,
  name: staff.name,
  phone: staff.phone,
  salary: staff.salary,
  status: staff.status,
  notes: staff.notes || ''
});

  }

  saveStaff(): void {
    if (this.staffForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly', 'Close', { duration: 3000 });
      return;
    }

    const staffData = this.staffForm.value;
    this.isLoading = true;

    if (this.isEditing && this.selectedStaff) {
      this.staffService.updateStaff(this.selectedStaff._id!, staffData).subscribe({
        next: (response) => {
          this.snackBar.open('Staff updated successfully', 'Close', { duration: 3000 });
          this.loadStaff();
          this.isEditing = false;
          this.selectedStaff = null;
          this.staffForm.reset();
        },
        error: (error) => {
          console.error('Error updating staff:', error);
          this.snackBar.open('Error updating staff', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    } else {
      this.staffService.createStaff(staffData).subscribe({
        next: (response) => {
          this.snackBar.open('Staff created successfully', 'Close', { duration: 3000 });
          this.loadStaff();
          this.staffForm.reset();
        },
        error: (error) => {
          console.error('Error creating staff:', error);
          this.snackBar.open('Error creating staff', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  deleteStaff(staff: Staff): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Delete',
        message: `Are you sure you want to delete ${staff.name} (${staff.staffId})?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.staffService.deleteStaff(staff._id!).subscribe({
          next: (response) => {
            this.snackBar.open('Staff deleted successfully', 'Close', { duration: 3000 });
            this.loadStaff();
          },
          error: (error) => {
            console.error('Error deleting staff:', error);
            this.snackBar.open('Error deleting staff', 'Close', { duration: 3000 });
            this.isLoading = false;
          }
        });
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedStaff = null;
    this.staffForm.reset();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Inactive': return 'status-inactive';
      default: return '';
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'Doctor': return 'medical_services';
      case 'Nurse': return 'health_and_safety';
      case 'Reception': return 'desk';
      case 'Pharmacy': return 'medication';
      case 'Admin': return 'admin_panel_settings';
      default: return 'person';
    }
  }
}