import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { Attendance, AttendanceFilter } from '../../../models/attendance.model';
import { Staff } from '../../../models/staff.model';
import { AttendanceService } from '../../../service/attendance.service';
import { StaffService } from '../../../service/staff.service';
import { MatDividerModule } from "@angular/material/divider";
import { AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { PendingLogoutDialogComponent } from '../attendance-pending-logout-dialog/attendance-pending-logout-dialog.component';
import { ShiftService } from '../../../service/shift.service';
import { Shift } from '../../../models/shift.model';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-attendance-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './attendance-history.component.html',
  styleUrls: ['./attendance-history.component.scss']
})
export class AttendanceHistoryComponent implements OnInit, AfterViewInit  {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  attendanceData: Attendance[] = [];
  filteredData: Attendance[] = [];
  staffList: Staff[] = [];
  roles: string[] = [];
  shifts: Shift[] = [];

  totalOvertimeHours = 0;
  avgAttendanceHours = 0;

  displayedColumns: string[] = [
    'date',
    'staffDetails',
    'shiftDetails',
    'duration',
    'overtime',
    'status',
    'enteredBy',
    'remarks'
  ];
  
  dataSource = new MatTableDataSource<Attendance>([]);
  
  isLoading = false;
  totalRecords = 0;
  
  // Today summary
  totalStaffCount = 0;
  todayPresentCount = 0;
  todayAbsentCount = 0;
  todayHalfDayCount = 0;
  todayOvertimeCount = 0;

  selectedFilters: string[] = [];

  constructor(
    private attendanceService: AttendanceService,
    private staffService: StaffService,
    private shiftService: ShiftService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
      private cdr: ChangeDetectorRef

  ) {
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const formatDate = (date: Date) => {
      const d = new Date(date);
      return d;
    };

    this.filterForm = this.fb.group({
      startDate: [formatDate(startDate)],
      endDate: [formatDate(endDate)],
      staffId: [''],
      jobRole: [''],
      shiftId: [''] // ✅ ADD SHIFT FILTER
    });
  }

  ngOnInit(): void {
    this.loadStaff();
    this.loadShifts();
    this.loadAttendance();
    this.loadTodaySummary();
    this.loadPendingLogoutCount();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  resetDateRange(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm.patchValue({
      startDate: firstDayOfMonth,
      endDate: today
    });
    
    this.loadAttendance();
  }

  loadShifts(): void {
    this.shiftService.getShifts().subscribe({
      next: (res) => {
        this.shifts = res.data;
      },
      error: (error) => {
        console.error('Error loading shifts:', error);
      }
    });
  }

  loadTodaySummary(): void {
    // Load total active staff
    this.staffService.getActiveStaff().subscribe({
      next: staffRes => {
        const activeStaff = staffRes.data;
        this.totalStaffCount = activeStaff.length;

        // Load today's attendance
        this.attendanceService.getTodayAttendance().subscribe({
          next: attRes => {
            const todayData = attRes.data;

            // Present count
            this.todayPresentCount = todayData.filter(a => a.status === 'Present').length;

            // Half Day count
            this.todayHalfDayCount = todayData.filter(a => a.status === 'Half Day').length;

            // Explicit Absent
            const explicitAbsentCount = todayData.filter(a => a.status === 'Absent').length;

            // Staff who marked ANY attendance today
            const markedStaffIds = new Set(todayData.map(a => a.staffId));

            // Not marked at all today
            const notMarkedCount = activeStaff.filter(s => !markedStaffIds.has(s.staffId)).length;

            // ✅ FINAL Absent count
            this.todayAbsentCount = explicitAbsentCount + notMarkedCount;

            // ✅ Overtime count - FIXED: Use optional property
            this.todayOvertimeCount = todayData.filter(a => 
              a.overtimeMinutes && a.overtimeMinutes > 0
            ).length;
          }
        });
      }
    });
  }

  loadStaff(): void {
    this.staffService.getActiveStaff().subscribe({
      next: (response) => {
        this.staffList = response.data;
        
        // ✅ Extract unique job roles dynamically
        this.roles = [
          ...new Set(this.staffList.map(s => s.jobRole).filter(Boolean))
        ];
      },
      error: (error) => {
        console.error('Error loading staff:', error);
        this.snackBar.open('Error loading staff data', 'Close', { duration: 3000 });
      }
    });
  }

  get presentCount(): number {
    return this.filteredData.filter(a => a.status === 'Present').length;
  }

  get absentCount(): number {
    return this.filteredData.filter(a => a.status === 'Absent').length;
  }

  get halfDayCount(): number {
    return this.filteredData.filter(a => a.status === 'Half Day').length;
  }

  getDuration(minutes?: number, outTime?: Date | string): string {
    if (!outTime) return 'Ongoing';
    if (!minutes) return '0h 0m';
    
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
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

loadAttendance(): void {
  this.isLoading = true;
  this.cdr.detectChanges();

  const fv = this.filterForm.value;
  const filter: AttendanceFilter = {};

  if (fv.startDate) {
    filter.startDate = this.formatDateLocal(fv.startDate);
  }
  if (fv.endDate) {
    filter.endDate = this.formatDateLocal(fv.endDate);
  }
  if (fv.staffId) filter.staffId = fv.staffId;
  if (fv.jobRole) filter.jobRole = fv.jobRole;
  if (fv.shiftId) filter.shiftId = fv.shiftId;

  this.updateSelectedFilters(fv);

  this.attendanceService.getAttendanceByDateRange(filter).subscribe({
    next: (res) => {
      this.attendanceData = res.data || [];
      this.filteredData = [...this.attendanceData];
      this.totalRecords = this.filteredData.length;
      
      this.calculateSummaryStats();
      
      // Update data source and force change detection
      this.dataSource.data = this.filteredData;
      this.isLoading = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Error loading attendance:', error);
      this.snackBar.open('Failed to load attendance records', 'Close', { duration: 3000 });
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  });
}

  // ✅ CALCULATE SUMMARY STATISTICS - FIXED VERSION
  calculateSummaryStats(): void {
    let totalMinutes = 0;
    let totalOvertime = 0;
    let recordCount = 0;

    this.filteredData.forEach(record => {
      if (record.totalMinutes) {
        totalMinutes += record.totalMinutes;
        recordCount++;
      }
      // ✅ FIX: Check if overtimeMinutes exists before using it
      if (record.overtimeMinutes) {
        totalOvertime += record.overtimeMinutes;
      }
    });

    this.totalOvertimeHours = Math.round(totalOvertime / 60 * 10) / 10; // Rounded to 1 decimal
    this.avgAttendanceHours = recordCount > 0 ? 
      Math.round((totalMinutes / recordCount / 60) * 10) / 10 : 0;
  }

  // ✅ FORMAT OVERTIME DISPLAY
  getOvertimeDisplay(overtimeMinutes?: number): string {
    if (!overtimeMinutes || overtimeMinutes <= 0) return '-';
    
    const h = Math.floor(overtimeMinutes / 60);
    const m = overtimeMinutes % 60;
    return `+${h}h ${m}m`;
  }

  updateSelectedFilters(formValue: any): void {
    this.selectedFilters = [];
    
    if (formValue.startDate) {
      const date = new Date(formValue.startDate);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      this.selectedFilters.push(`From: ${formattedDate}`);
    }
    
    if (formValue.endDate) {
      const date = new Date(formValue.endDate);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      this.selectedFilters.push(`To: ${formattedDate}`);
    }
    
    if (formValue.staffId) {
      const staff = this.staffList.find(s => s.staffId === formValue.staffId);
      if (staff) {
        this.selectedFilters.push(`Staff: ${staff.name}`);
      }
    }
    
    if (formValue.jobRole) {
      this.selectedFilters.push(`Role: ${formValue.jobRole}`);
    }
    
    if (formValue.shiftId) {
      const shift = this.shifts.find(s => s._id === formValue.shiftId);
      if (shift) {
        this.selectedFilters.push(`Shift: ${shift.name}`);
      }
    }
  }

  clearFilters(): void {
    // Reset to default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Fix: Use patchValue with proper date objects
    this.filterForm.patchValue({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      staffId: '',
      jobRole: '',
      shiftId: ''
    });

    this.selectedFilters = [];
    this.loadAttendance();
  }

  removeFilter(filter: string): void {
    const filterParts = filter.split(': ');
    const filterType = filterParts[0];
    
    if (filterType === 'From') {
      // Set start date to 30 days ago from current end date
      const endDate = this.filterForm.value.endDate || new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);
      this.filterForm.patchValue({ startDate });
    } 
    else if (filterType === 'To') {
      // Set end date to today
      this.filterForm.patchValue({ endDate: new Date() });
    } 
    else if (filterType === 'Staff') {
      this.filterForm.patchValue({ staffId: '' });
    } 
    else if (filterType === 'Role') {
      this.filterForm.patchValue({ jobRole: '' });
    }
    else if (filterType === 'Shift') {
      this.filterForm.patchValue({ shiftId: '' });
    }

    // Remove the filter from the selected filters array
    this.selectedFilters = this.selectedFilters.filter(f => f !== filter);
    
    // Reload data with updated filters
    this.loadAttendance();
  }

  private formatDateLocal(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  exportData(format: 'excel' | 'pdf'): void {
    const { startDate, endDate, staffId, jobRole, shiftId } = this.filterForm.value;

    if (!startDate || !endDate) {
      this.snackBar.open('Please select date range', 'Close', { duration: 3000 });
      return;
    }

    // Fix: Get formatted Date objects
    const formattedStartDate = this.formatDateLocal(startDate);
    const formattedEndDate = this.formatDateLocal(endDate);

    this.isLoading = true;

    // Pass Date objects to service
    this.attendanceService
      .exportAttendance(formattedStartDate, formattedEndDate, format, staffId, jobRole, shiftId )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const dateStr = new Date().toISOString().split('T')[0];
          a.download = `attendance_report_${dateStr}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.isLoading = false;
          this.snackBar.open(`Report exported successfully as ${format.toUpperCase()}`, 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Export error:', error);
          this.isLoading = false;
          this.snackBar.open('Export failed. Please try again.', 'Close', { duration: 3000 });
        }
      });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Present': return 'check_circle';
      case 'Absent': return 'cancel';
      case 'Half Day': return 'schedule';
      default: return 'help';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Present': return 'present';
      case 'Absent': return 'absent';
      case 'Half Day': return 'half-day';
      default: return '';
    }
  }

  pendingLogoutCount = 0;

openPendingLogoutDialog(): void {
  const ref = this.dialog.open(PendingLogoutDialogComponent, {
    width: '900px',
    disableClose: true
  });

  ref.afterClosed().subscribe((refreshNeeded) => {
    if (refreshNeeded) {
      // Refresh both pending count and attendance history
      this.loadPendingLogoutCount();
      this.loadAttendance(); // Refresh the main table
      this.loadTodaySummary(); // Refresh summary stats
    }
  });
}

loadPendingLogoutCount(): void {
  this.attendanceService.getPendingLogout().subscribe({
    next: (res) => {
      this.pendingLogoutCount = res.data?.length || 0;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error loading pending logout count', err);
      this.pendingLogoutCount = 0;
    }
  });
}

  getShiftIcon(shift: any): string {
    const name = shift?.name?.toLowerCase() || '';

    if (name.includes('morning')) return 'wb_sunny';
    if (name.includes('evening')) return 'nights_stay';
    if (name.includes('night')) return 'dark_mode';

    return 'schedule';
  }
}