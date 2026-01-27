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
  
  displayedColumns: string[] = [
    'date',
    'staffDetails',
    'shiftDetails',
    'duration',
    'status',
    'enteredBy',
    'remarks'
  ];
  dataSource = new MatTableDataSource<Attendance>();
  
  isLoading = false;
  totalRecords = 0;
  // 🔥 Today summary
totalStaffCount = 0;
todayPresentCount = 0;
todayAbsentCount = 0;
todayHalfDayCount = 0;

  selectedFilters: string[] = [];

  constructor(
    private attendanceService: AttendanceService,
    private staffService: StaffService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
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
      jobRole: ['']
    });
  }

  ngOnInit(): void {
    this.loadStaff();
    this.loadAttendance();
     this.loadTodaySummary();
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
loadTodaySummary(): void {
  // 1️⃣ Load total active staff
  this.staffService.getActiveStaff().subscribe({
    next: staffRes => {
      const activeStaff = staffRes.data;
      this.totalStaffCount = activeStaff.length;

      // 2️⃣ Load today's attendance
      this.attendanceService.getTodayAttendance().subscribe({
        next: attRes => {
          const todayData = attRes.data;

          // Present
          this.todayPresentCount =
            todayData.filter(a => a.status === 'Present').length;

          // Half Day
          this.todayHalfDayCount =
            todayData.filter(a => a.status === 'Half Day').length;

          // Explicit Absent (manually marked)
          const explicitAbsentCount =
            todayData.filter(a => a.status === 'Absent').length;

          // Staff who marked ANY attendance today
          const markedStaffIds = new Set(
            todayData.map(a => a.staffId)
          );

          // Not marked at all today
          const notMarkedCount =
            activeStaff.filter(s => !markedStaffIds.has(s.staffId)).length;

          // ✅ FINAL Absent count
          this.todayAbsentCount =
            explicitAbsentCount + notMarkedCount;
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
    return this.attendanceData.filter(a => a.status === 'Present').length;
  }

  get absentCount(): number {
    return this.attendanceData.filter(a => a.status === 'Absent').length;
  }

  get halfDayCount(): number {
    return this.attendanceData.filter(a => a.status === 'Half Day').length;
  }

  getDuration(minutes?: number, outTime?: string): string {
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

    const fv = this.filterForm.value;
    const filter: AttendanceFilter = {};

    // Fix: Use Date objects instead of strings
    if (fv.startDate) {
      filter.startDate = this.formatDateForBackend(fv.startDate, 'start');
    }
    if (fv.endDate) {
      filter.endDate = this.formatDateForBackend(fv.endDate, 'end');
    }
    if (fv.staffId) {
      filter.staffId = fv.staffId;
    }
    if (fv.jobRole) {
      filter.jobRole = fv.jobRole;
    }

    console.log('Filter criteria:', filter); // Debug log

    this.updateSelectedFilters(fv);

    this.attendanceService.getAttendanceByDateRange(filter).subscribe({
      next: (res) => {
        this.attendanceData = res.data;
        this.filteredData = res.data;
        this.totalRecords = res.data.length;
        
        // Update data source with filtered data
        this.dataSource.data = this.filteredData;
        
        // Reinitialize paginator and sort
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.snackBar.open('Failed to load attendance records', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }


private formatDate(date: Date, type: 'start' | 'end' = 'start'): string {
  const d = new Date(date);
  
  // For start date: set to beginning of day
  if (type === 'start') {
    d.setHours(0, 0, 0, 0);
  } 
  // For end date: set to end of day
  else {
    d.setHours(23, 59, 59, 999);
  }
  
  // Return ISO string without timezone offset
  return d.toISOString().split('T')[0];
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
      jobRole: ''
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

  // Remove the filter from the selected filters array
  this.selectedFilters = this.selectedFilters.filter(f => f !== filter);
  
  // Reload data with updated filters
  this.loadAttendance();
}

   exportData(format: 'excel' | 'pdf'): void {
    const { startDate, endDate, staffId, jobRole } = this.filterForm.value;

    if (!startDate || !endDate) {
      this.snackBar.open('Please select date range', 'Close', { duration: 3000 });
      return;
    }

    // Fix: Get formatted Date objects
    const formattedStartDate = this.formatDateForBackend(startDate, 'start');
    const formattedEndDate = this.formatDateForBackend(endDate, 'end');

    this.isLoading = true;

    // Pass Date objects to service
    this.attendanceService
      .exportAttendance(formattedStartDate, formattedEndDate, format, staffId, jobRole)
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
  // Fix: New method for proper date formatting
  private formatDateForBackend(date: Date, type: 'start' | 'end'): Date {
    const d = new Date(date);
    
    if (type === 'start') {
      d.setHours(0, 0, 0, 0);
    } else {
      d.setHours(23, 59, 59, 999);
    }
    
    // Return ISO string in YYYY-MM-DD format
    return d;
  }
  printReport(): void {
    // Create a printable version of the report
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const title = 'Attendance Report';
      const dateRange = `From ${this.filterForm.value.startDate?.toLocaleDateString()} To ${this.filterForm.value.endDate?.toLocaleDateString()}`;
      
      const htmlContent = `
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              .header { text-align: center; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
              .summary { display: flex; justify-content: space-between; margin: 20px 0; }
              .summary-card { border: 1px solid #ddd; padding: 15px; text-align: center; flex: 1; margin: 0 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${title}</h1>
              <p>${dateRange}</p>
              <p>Total Records: ${this.totalRecords}</p>
            </div>
            
            <div class="summary">
              <div class="summary-card">
                <h3>Present</h3>
                <p>${this.presentCount}</p>
              </div>
              <div class="summary-card">
                <h3>Absent</h3>
                <p>${this.absentCount}</p>
              </div>
              <div class="summary-card">
                <h3>Half Day</h3>
                <p>${this.halfDayCount}</p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Staff Name</th>
                  <th>Staff ID</th>
                  <th>Role</th>
                  <th>Shift</th>
                  <th>In Time</th>
                  <th>Out Time</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${this.filteredData.map(record => `
                  <tr>
                    <td>${new Date(record.date).toLocaleDateString()}</td>
                    <td>${record.staffName}</td>
                    <td>${record.staffId}</td>
                    <td>${record.jobRole}</td>
                    <td>${record.shift}</td>
                    <td>${record.inTime}</td>
                    <td>${record.outTime || '-'}</td>
                    <td>${record.status}</td>
                    <td>${record.remarks || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 500);
              }
            </script>
          </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
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

  getShiftIcon(shift: string): string {
    switch (shift) {
      case 'Morning': return 'wb_sunny';
      case 'Evening': return 'nights_stay';
      case 'Full Day': return 'all_inclusive';
      case 'On Call': return 'phone_in_talk';
      default: return 'schedule';
    }
  }
}