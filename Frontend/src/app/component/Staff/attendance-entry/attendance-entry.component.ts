import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { AttendanceService } from '../../../service/attendance.service';
import { StaffService } from '../../../service/staff.service';
import { Staff } from '../../../models/staff.model';
import { Attendance, MarkAttendanceDto } from '../../../models/attendance.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { MatDividerModule } from "@angular/material/divider";
import { Shift } from '../../../models/shift.model';
import { ShiftService } from '../../../service/shift.service';
@Component({
  selector: 'app-attendance-entry',
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
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatDividerModule
],
  templateUrl: './attendance-entry.component.html',
  styleUrls: ['./attendance-entry.component.scss']
})
export class AttendanceEntryComponent implements OnInit {
  attendanceForm: FormGroup;
  todayAttendance: Attendance[] = [];
  activeStaff: Staff[] = [];
  
  displayedColumns: string[] = ['staffId', 'staffName', 'role', 'shiftId', 'inTime', 'outTime', 'status', 'enteredBy', 'actions'];
  dataSource = new MatTableDataSource<Attendance>();
  
shifts: Shift[] = [];
  
  isLoading = false;
  isEditing = false;
  editingId: string | null = null;
  
  filteredStaff: Staff[] = [];
  selectedStaff: Staff | null = null;
  today = new Date();

  constructor(
    private attendanceService: AttendanceService,
    private staffService: StaffService,
    private shiftService: ShiftService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.attendanceForm = this.fb.group({
      date: [new Date(), Validators.required],
      staff: [null, Validators.required],
      staffName: [''],
  jobRole: [''],
 shiftId: [null, Validators.required], 
   inTime: [this.getCurrentTime()],
 outTime: [''],
      //  status: ['Present', Validators.required],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.loadTodayAttendance();
    this.loadActiveStaff();
    
    this.shiftService.getShifts().subscribe(res => {
    this.shifts = res.data;
  });
}
  displayStaff = (staff: Staff): string => {
  return staff ? `${staff.name} (${staff.staffId})` : '';
};

onStaffSelect(staff: Staff) {
  this.attendanceForm.patchValue({
    staffName: staff.name,
    jobRole: staff.jobRole,
    inTime: this.getCurrentTime()
  });
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
getJobRoleIcon(jobRole: string): string {
  const role = jobRole.toLowerCase();

  if (role.includes('doctor')) return 'medical_services';
  if (role.includes('nurse')) return 'health_and_safety';
  if (role.includes('reception')) return 'desk';
  if (role.includes('pharmacy')) return 'medication';
  if (role.includes('clean')) return 'cleaning_services';
  if (role.includes('security')) return 'security';
  if (role.includes('ward')) return 'local_hospital';

  return 'person';
}

  loadTodayAttendance(): void {
    this.isLoading = true;
    this.attendanceService.getTodayAttendance().subscribe({
      next: (response) => {
        this.todayAttendance = response.data;
        this.dataSource.data = this.todayAttendance;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.snackBar.open('Error loading attendance', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadActiveStaff(): void {
    this.staffService.getActiveStaff().subscribe({
      next: (response) => {
        this.activeStaff = response.data;
        this.filteredStaff = [...this.activeStaff];
      },
      error: (error) => {
        console.error('Error loading staff:', error);
      }
    });
  }

  filterStaff(event: Event): void {
    const input = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredStaff = this.activeStaff.filter(staff =>
      staff.name.toLowerCase().includes(input) ||
      staff.staffId.toLowerCase().includes(input)
    );
  }

  markAttendance(): void {
    if (this.attendanceForm.invalid) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

   
  const formData = this.attendanceForm.value;

  // Normalize date
  const attendanceDate = new Date(formData.date);
  attendanceDate.setHours(0, 0, 0, 0);

  // Convert time string → Date
  const inDateTime = new Date(attendanceDate);
  const [h, m] = formData.inTime.split(':');
  inDateTime.setHours(+h, +m, 0, 0);

const attendanceData: MarkAttendanceDto = {
  date: attendanceDate,
  staffId: formData.staff.staffId,
  staffName: formData.staffName,
  jobRole: formData.jobRole,
  shiftId: formData.shiftId,          // ✅ FIX
  inTime: formData.inTime,             // ✅ FIX (string HH:mm)
  status: formData.status,             // ✅ FIX
  remarks: formData.remarks
};


    this.isLoading = true;

    if (this.isEditing && this.editingId) {
  

const now = new Date();
const outTime =
  `${now.getHours().toString().padStart(2,'0')}:` +
  `${now.getMinutes().toString().padStart(2,'0')}`;

this.attendanceService.updateAttendance(this.editingId, {
  outTime   // ✅ string HH:mm
}).subscribe({
  next: () => {
    this.snackBar.open('Attendance updated successfully', 'Close', { duration: 3000 });
    this.resetForm();
    this.loadTodayAttendance();
  },
  error: () => {
    this.isLoading = false;
  }
});

    } else {
      this.attendanceService.markAttendance(attendanceData).subscribe({
        next: (response) => {
          this.snackBar.open('Attendance marked successfully', 'Close', { duration: 3000 });
          this.resetForm();
          this.loadTodayAttendance();
        },
        error: (error) => {
          console.error('Error marking attendance:', error);
          this.snackBar.open('Error marking attendance', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  editAttendance(attendance: Attendance): void {
    this.isEditing = true;
    this.editingId = attendance._id!;
    
    const staff = this.activeStaff.find(s => s.staffId === attendance.staffId);
    this.selectedStaff = staff || null;
    
    this.attendanceForm.patchValue({
      date: new Date(attendance.date),
  staff: staff || null,
      staffName: attendance.staffName,
jobRole: attendance.jobRole,
shiftId: attendance.shiftId,  
      inTime: attendance.inTime,
      outTime: attendance.outTime || '',
      status: attendance.status,
      remarks: attendance.remarks || ''
    });
  }

  markOut(attendance: Attendance): void {
    const currentTime = new Date();
    const outTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Mark Out Time',
        message: `Mark out time for ${attendance.staffName} as ${outTime}?`,
        confirmText: 'Mark Out',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.attendanceService.updateAttendance(attendance._id!, { outTime }).subscribe({
          next: (response) => {
            this.snackBar.open('Out time marked successfully', 'Close', { duration: 3000 });
            this.loadTodayAttendance();
          },
          error: (error) => {
            console.error('Error marking out time:', error);
            this.snackBar.open('Error marking out time', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteAttendance(attendance: Attendance): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Attendance',
        message: `Delete attendance record for ${attendance.staffName} on ${new Date(attendance.date).toLocaleDateString()}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Note: You'll need to add a delete endpoint in your backend
        this.snackBar.open('Delete functionality to be implemented', 'Close', { duration: 3000 });
      }
    });
  }
getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

  resetForm(): void {
    this.isEditing = false;
    this.editingId = null;
    this.selectedStaff = null;
    this.attendanceForm.reset({
      date: new Date(),
      staffName: '',
      role: '',
 shiftId: null,  
       inTime: '09:00',
  outTime: '',
      status: 'Present',
      remarks: ''
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

getShiftIcon(shift: any): string {
  const name = shift?.name?.toLowerCase() || '';
  if (name.includes('morning')) return 'wb_sunny';
  if (name.includes('evening')) return 'nights_stay';
  if (name.includes('night')) return 'dark_mode';
  return 'schedule';
}


 canMarkOut(attendance: Attendance): boolean {
  return !attendance.outTime;
}

}