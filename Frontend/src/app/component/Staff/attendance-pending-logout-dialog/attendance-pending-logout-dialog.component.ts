import { CommonModule } from "@angular/common";
import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Attendance } from "../../../models/attendance.model";
import { AttendanceService } from "../../../service/attendance.service";
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-pending-logout-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FormsModule,
    MatProgressSpinnerModule
],
  templateUrl: './attendance-pending-logout-dialog.component.html',
  styleUrls: ['./attendance-pending-logout-dialog.component.scss']
})
export class PendingLogoutDialogComponent implements OnInit {
  data: Attendance[] = [];
  loading = false;

  constructor(
    private attendanceService: AttendanceService,
    private dialogRef: MatDialogRef<PendingLogoutDialogComponent>,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPendingLogouts();
  }

  loadPendingLogouts(): void {
    this.loading = true;
    this.attendanceService.getPendingLogout().subscribe({
      next: (res) => {
        // Initialize showForce and forceOutTime for each record
        this.data = (res.data || []).map(item => ({
          ...item,
          showForce: false,
          forceOutTime: this.getCurrentDateTime()
        }));
        this.loading = false;
        this.cdr.detectChanges(); // Force change detection
      },
      error: (err) => {
        console.error('Error loading pending logouts', err);
        this.snackBar.open('Failed to load pending logouts', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  getCurrentDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  enableForce(att: any): void {
    // Toggle the force logout UI
    att.showForce = !att.showForce;
    if (att.showForce) {
      att.forceOutTime = this.getCurrentDateTime();
    }
  }

confirmForceLogout(att: any): void {
  if (!att.forceOutTime) {
    this.snackBar.open('Please select logout time', 'Close', { duration: 3000 });
    return;
  }

  this.loading = true;
  this.cdr.detectChanges();
  
  // Convert datetime-local string to Date object
  const outTimeDate = new Date(att.forceOutTime);
  
  // Validate date
  if (isNaN(outTimeDate.getTime())) {
    this.snackBar.open('Invalid date/time format', 'Close', { duration: 3000 });
    this.loading = false;
    return;
  }

  this.attendanceService.adminCloseAttendance(att._id, {
    outTime: outTimeDate,
    reason: 'Forgot to logout'
  }).subscribe({
    next: (response) => {
      if (response.success) {
        // Remove this item from the list
        this.data = this.data.filter(a => a._id !== att._id);
        this.snackBar.open('Logout marked successfully', 'Close', { duration: 3000 });
        
        // Close dialog if no more pending logouts
        if (this.data.length === 0) {
          this.dialogRef.close(true);
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      } else {
        this.snackBar.open('Failed to mark logout', 'Close', { duration: 3000 });
        this.loading = false;
      }
    },
    error: (error) => {
      console.error('Error marking logout:', error);
      const errorMsg = error.error?.error || 'Failed to mark logout';
      this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

  close(): void {
    this.dialogRef.close(true); // Pass true to indicate refresh needed
  }
}