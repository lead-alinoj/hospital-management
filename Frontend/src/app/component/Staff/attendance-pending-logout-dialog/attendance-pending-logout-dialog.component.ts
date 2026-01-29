import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { Attendance } from "../../../models/attendance.model";
import { AttendanceService } from "../../../service/attendance.service";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pending-logout-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FormsModule
  ],
 templateUrl: './attendance-pending-logout-dialog.component.html',
  styleUrls: ['./attendance-pending-logout-dialog.component.scss']
})
  
export class PendingLogoutDialogComponent implements OnInit {

  data: Attendance[] = [];

  constructor(
    private attendanceService: AttendanceService,
    private dialogRef: MatDialogRef<PendingLogoutDialogComponent>
  ) {}

  ngOnInit(): void {
    this.attendanceService.getPendingLogout().subscribe(res => {
      this.data = res.data;
    });
  }

  close(): void {
    this.dialogRef.close();
  }

enableForce(att: any): void {
  att.showForce = true;
  att.forceOutTime = new Date().toISOString().slice(0,16);
}

confirmForceLogout(att: any): void {
  if (!att.forceOutTime) {
    alert('Please select logout time');
    return;
  }

  this.attendanceService.adminCloseAttendance(att._id, {
    outTime: new Date(att.forceOutTime),
    reason: 'Forgot to logout'
  }).subscribe(() => {
    this.data = this.data.filter(a => a._id !== att._id);

    // ✅ CLOSE DIALOG TO TRIGGER REFRESH
    this.dialogRef.close(true);
  });
}
}
